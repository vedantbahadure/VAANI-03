"""VAANI backend — FastAPI entrypoint. Clean layering: routers -> services -> repos/adapters."""
import asyncio
import json
import logging
from typing import List, Optional

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from config import (CORS_ORIGINS, VAANI_MODE, SUPPORTED_LANGS, LLM_MODEL, STT_MODEL,
                    TTS_MODEL, RAG_SCORE_THRESHOLD)
from errors import register_error_handlers, NotFoundError, ValidationError, UpstreamError
from domain import Conversation, Message, Bookmark, new_id, now_iso
import repositories as repo
import rag as rag_svc
import ingest as ingest_svc
from ai_adapters import get_stt, get_tts
from vector_store import get_vector_store
from hardware import get_hardware
from db import close_db
from seed_knowledge import seed_if_empty

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("vaani")

app = FastAPI(title="VAANI API", version="1.0.0")
api = APIRouter(prefix="/api")


# ---------------- Health & System ----------------
@api.get("/health")
async def health():
    return {"status": "ok", "service": "vaani", "mode": VAANI_MODE}


@api.get("/system/status")
async def system_status():
    store = get_vector_store()
    hw = get_hardware()
    return {
        "mode": VAANI_MODE,
        "subsystems": {
            "llm": {"provider": "gemini", "model": LLM_MODEL, "status": "online"},
            "stt": {"model": STT_MODEL, "status": "online"},
            "tts": {"model": TTS_MODEL, "voice": "nova (female)", "status": "online"},
            "vector_store": {"engine": "chromadb", "vectors": store.count(), "status": "online"},
            "database": {"engine": "sqlite", "status": "online"},
        },
        "knowledge": {
            "documents": await repo.document_count(),
            "domains": await repo.domain_counts(),
            "vectors": store.count(),
            "rag_threshold": RAG_SCORE_THRESHOLD,
        },
        "hardware": {"adapter": hw.name, "description": hw.description},
        "languages": SUPPORTED_LANGS,
    }


@api.get("/hardware/capabilities")
async def hardware_caps():
    hw = get_hardware()
    return {"adapter": hw.name, "description": hw.description, "capabilities": hw.capabilities}


# ---------------- Chat (RAG + SSE streaming) ----------------
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    language: str = "en"
    domain: Optional[str] = None


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@api.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    if not req.message.strip():
        raise ValidationError("Message cannot be empty.")

    language = req.language if req.language in SUPPORTED_LANGS else rag_svc.detect_language(req.message)

    conv = await repo.get_conversation(req.conversation_id) if req.conversation_id else None
    if conv is None:
        title = req.message.strip()[:60]
        conv = await repo.create_conversation(Conversation(title=title, language=language))
    await repo.add_message(Message(conversation_id=conv.id, role="user", content=req.message, language=language))

    search_query = await rag_svc.translate_query_to_english(req.message, language)
    result = await asyncio.to_thread(rag_svc.retrieve, search_query, language, req.domain)

    async def gen():
        try:
            yield _sse("meta", {
                "conversation_id": conv.id,
                "language": language,
                "grounded": result.grounded,
                "confidence": result.confidence,
                "retrieved": len(result.chunks),
                "citations": [c.model_dump() for c in result.citations],
            })
            full = []
            async for delta in rag_svc.stream_answer(req.message, result, session_id=new_id()):
                full.append(delta)
                yield _sse("token", {"delta": delta})
            answer = "".join(full).strip() or "…"
            msg = await repo.add_message(Message(
                conversation_id=conv.id, role="assistant", content=answer, language=language,
                confidence=result.confidence, grounded=result.grounded, citations=result.citations))
            await repo.touch_conversation(conv.id)
            yield _sse("done", {"message_id": msg.id, "conversation_id": conv.id})
        except Exception as e:  # graceful degrade
            logger.exception("chat stream failed")
            yield _sse("error", {"message": f"VAANI could not complete the response: {str(e)[:200]}"})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                                      "Connection": "keep-alive"})


# ---------------- Conversations / History ----------------
@api.get("/conversations")
async def list_conversations():
    return [c.model_dump() for c in await repo.list_conversations()]


@api.get("/conversations/search")
async def search_conversations(q: str):
    return await repo.search_messages(q)


@api.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    conv = await repo.get_conversation(conv_id)
    if not conv:
        raise NotFoundError("Conversation not found.")
    msgs = await repo.list_messages(conv_id)
    return {"conversation": conv.model_dump(), "messages": [m.model_dump() for m in msgs]}


@api.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    await repo.delete_conversation(conv_id)
    return {"deleted": conv_id}


# ---------------- Voice ----------------
@api.post("/voice/transcribe")
async def transcribe(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    data = await audio.read()
    if len(data) == 0:
        raise ValidationError("Empty audio.")
    lang = language if language in SUPPORTED_LANGS else None
    try:
        text = await get_stt().transcribe(data, audio.filename or "audio.webm", lang)
    except Exception as e:
        raise UpstreamError(f"Transcription failed: {str(e)[:200]}")
    return {"text": text, "language": lang or rag_svc.detect_language(text)}


class SpeakRequest(BaseModel):
    text: str
    voice: str = "nova"


class TranslateRequest(BaseModel):
    text: str
    target: str = "en"


@api.post("/translate")
async def translate(req: TranslateRequest):
    if not req.text.strip():
        raise ValidationError("Text cannot be empty.")
    target = SUPPORTED_LANGS.get(req.target, "English")
    from ai_adapters import get_llm
    system = (f"You are a precise translator. Translate the user's text into {target}. "
              "Preserve meaning, numbers and scheme names. Output ONLY the translation, nothing else.")
    try:
        out = await get_llm().complete(system, req.text)
    except Exception as e:
        raise UpstreamError(f"Translation failed: {str(e)[:200]}")
    return {"text": (out or "").strip(), "target": req.target}


@api.post("/voice/speak")
async def speak(req: SpeakRequest):
    if not req.text.strip():
        raise ValidationError("Text cannot be empty.")
    try:
        audio = await get_tts().synthesize(req.text, req.voice)
    except Exception as e:
        raise UpstreamError(f"Speech synthesis failed: {str(e)[:200]}")
    return Response(content=audio, media_type="audio/mpeg")


# ---------------- Knowledge ----------------
@api.get("/knowledge")
async def knowledge(domain: Optional[str] = None):
    return [d.model_dump() for d in await repo.list_documents(domain)]


@api.get("/knowledge/domains")
async def knowledge_domains():
    return await repo.domain_counts()


@api.get("/knowledge/search")
async def knowledge_search(q: str, domain: Optional[str] = None):
    chunks = await asyncio.to_thread(ingest_svc.semantic_preview, q, 6, domain)
    return [c.model_dump() for c in chunks]


# ---------------- Documents ----------------
@api.get("/documents")
async def documents():
    docs = await repo.list_documents()
    return [d.model_dump() for d in docs if d.origin == "upload"]


@api.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    doc = await repo.get_document(doc_id)
    if not doc:
        raise NotFoundError("Document not found.")
    await ingest_svc.delete_document(doc_id)
    return {"deleted": doc_id}


@api.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), domain: str = Form("faq"),
                          language: str = Form("en")):
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise ValidationError("File too large (max 25MB).")
    doc = await ingest_svc.ingest_upload(file.filename or "document.txt", data, domain, language)
    return doc.model_dump()


class DocAskRequest(BaseModel):
    message: str
    language: str = "en"


@api.post("/documents/{doc_id}/ask")
async def ask_document(doc_id: str, req: DocAskRequest):
    doc = await repo.get_document(doc_id)
    if not doc:
        raise NotFoundError("Document not found.")
    language = req.language if req.language in SUPPORTED_LANGS else rag_svc.detect_language(req.message)
    store = get_vector_store()
    search_query = await rag_svc.translate_query_to_english(req.message, language)
    chunks = await asyncio.to_thread(store.query, search_query, 5, {"document_id": doc_id})
    kept = [c for c in chunks if c.score >= RAG_SCORE_THRESHOLD] or chunks[:3]
    from domain import Citation
    result = rag_svc.RagResult(
        kept, grounded=len(kept) > 0, confidence=rag_svc.compute_confidence(chunks, len(kept)),
        citations=[Citation(n=i + 1, document_id=c.document_id, title=c.title, domain=c.domain,
                            source=c.source, snippet=c.text[:220]) for i, c in enumerate(kept)],
        language=language)

    async def gen():
        yield _sse("meta", {"grounded": result.grounded, "confidence": result.confidence,
                            "language": language,
                            "citations": [c.model_dump() for c in result.citations]})
        async for delta in rag_svc.stream_answer(req.message, result, session_id=new_id()):
            yield _sse("token", {"delta": delta})
        yield _sse("done", {})

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ---------------- Bookmarks ----------------
class BookmarkRequest(BaseModel):
    message_id: str
    conversation_id: str
    content: Optional[str] = None
    note: Optional[str] = None


@api.post("/bookmarks")
async def add_bookmark(req: BookmarkRequest):
    bm = Bookmark(**req.model_dump())
    return (await repo.add_bookmark(bm)).model_dump()


@api.get("/bookmarks")
async def list_bookmarks():
    return [b.model_dump() for b in await repo.list_bookmarks()]


@api.delete("/bookmarks/{bm_id}")
async def delete_bookmark(bm_id: str):
    await repo.delete_bookmark(bm_id)
    return {"deleted": bm_id}


app.include_router(api)
register_error_handlers(app)
app.add_middleware(
    CORSMiddleware, allow_credentials=True, allow_origins=CORS_ORIGINS,
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    async def _seed():
        try:
            n = await seed_if_empty()
            if n:
                logger.info(f"Seeded {n} knowledge documents into VAANI KB.")
        except Exception:
            logger.exception("KB seeding failed")
    asyncio.create_task(_seed())


@app.on_event("shutdown")
async def shutdown():
    await close_db()
