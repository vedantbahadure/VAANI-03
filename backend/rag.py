"""RAG service: retrieve -> ground -> Gemini stream -> citations + confidence.
Trust rule: when verified docs exist above threshold, answer strictly from context."""
from typing import AsyncIterator, List, Optional, Tuple
from langdetect import detect, DetectorFactory
from config import RAG_TOP_K, RAG_SCORE_THRESHOLD, SUPPORTED_LANGS
from domain import RetrievedChunk, Citation
from vector_store import get_vector_store
from ai_adapters import get_llm

DetectorFactory.seed = 0

LANG_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}


async def translate_query_to_english(query: str, language: str) -> str:
    """Cross-lingual retrieval: seed KB is English, so translate non-English queries
    to English for embedding/search. Answer is still generated in the user's language."""
    has_deva = any("\u0900" <= ch <= "\u097F" for ch in query)
    if language == "en" and not has_deva:
        return query
    try:
        llm = get_llm()
        system = "You translate the user's question to concise English for a document search. Output ONLY the English translation, no quotes, no extra words."
        out = await llm.complete(system, query)
        out = (out or "").strip().strip('"')
        return out or query
    except Exception:
        return query


def detect_language(text: str, fallback: str = "en") -> str:
    # Devanagari present -> hi/mr; keep caller's fallback if it is mr
    if any("\u0900" <= ch <= "\u097F" for ch in text):
        return fallback if fallback in ("hi", "mr") else "hi"
    try:
        code = detect(text)
        return code if code in SUPPORTED_LANGS else "en"
    except Exception:
        return fallback


def compute_confidence(chunks: List[RetrievedChunk], used: int) -> float:
    if not chunks or used == 0:
        return 0.0
    top = chunks[0].score
    coverage = min(1.0, used / max(1, RAG_TOP_K))
    # Raw MiniLM cosine tops out ~0.55-0.65 even for excellent matches; normalise so a
    # strong, well-covered grounded answer reaches the High band (>=0.75).
    norm_top = min(1.0, top / 0.62)
    conf = 0.15 + 0.70 * norm_top + 0.15 * coverage
    return round(max(0.0, min(1.0, conf)), 3)


def _build_context(chunks: List[RetrievedChunk]) -> str:
    parts = []
    for i, c in enumerate(chunks, 1):
        parts.append(f"[{i}] (source: {c.title} — {c.domain})\n{c.text}")
    return "\n\n".join(parts)


def _system_prompt(lang: str, grounded: bool) -> str:
    lang_name = LANG_NAMES.get(lang, "English")
    if grounded:
        return (
            "You are VAANI, a trustworthy AI assistant for rural governance in India, helping "
            "farmers, cooperative members and rural citizens understand government schemes, "
            "cooperative law, PACS, crop insurance, agriculture and financial literacy.\n\n"
            "STRICT RULES:\n"
            "1. Answer ONLY using the CONTEXT below. Do NOT use outside knowledge.\n"
            "2. Cite every fact with bracketed numbers like [1], [2] matching the context blocks.\n"
            "3. If the context does not contain the answer, say so honestly.\n"
            "4. Be warm, clear and simple — the reader may be new to government processes.\n"
            f"5. Reply ENTIRELY in {lang_name}.\n"
            "6. Use short paragraphs and, where useful, simple numbered steps."
        )
    return (
        "You are VAANI, a trustworthy AI assistant for rural governance in India. "
        "You have NO verified document for this question. Do not invent specific facts, "
        "figures, eligibility rules or scheme names. Gently explain that you don't have "
        "verified information on this yet, suggest the closest relevant official topic, and "
        f"offer to help with a related question. Reply ENTIRELY in {LANG_NAMES.get(lang, 'English')}."
    )


class RagResult:
    def __init__(self, chunks: List[RetrievedChunk], grounded: bool, confidence: float,
                 citations: List[Citation], language: str):
        self.chunks = chunks
        self.grounded = grounded
        self.confidence = confidence
        self.citations = citations
        self.language = language


def retrieve(query: str, language: str, domain: Optional[str] = None) -> RagResult:
    store = get_vector_store()
    where = {"domain": domain} if domain else None
    chunks = store.query(query, k=RAG_TOP_K, where=where)
    kept = [c for c in chunks if c.score >= RAG_SCORE_THRESHOLD]
    grounded = len(kept) > 0
    use = kept if grounded else []
    confidence = compute_confidence(chunks, len(use)) if grounded else round(
        (chunks[0].score if chunks else 0.0) * 0.4, 3)
    citations = [
        Citation(n=i + 1, document_id=c.document_id, title=c.title, domain=c.domain,
                 source=c.source, snippet=(c.text[:220] + ("…" if len(c.text) > 220 else "")))
        for i, c in enumerate(use)
    ]
    return RagResult(use, grounded, confidence, citations, language)


async def stream_answer(query: str, result: RagResult, session_id: str) -> AsyncIterator[str]:
    llm = get_llm()
    if result.grounded:
        context = _build_context(result.chunks)
        prompt = f"CONTEXT:\n{context}\n\nQUESTION: {query}\n\nAnswer using only the context, with citations."
        system = _system_prompt(result.language, grounded=True)
    else:
        prompt = f"QUESTION: {query}"
        system = _system_prompt(result.language, grounded=False)
    async for delta in llm.stream(system, prompt, session_id):
        yield delta
