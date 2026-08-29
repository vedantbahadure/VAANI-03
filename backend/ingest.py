"""Document ingestion: chunk -> embed (Chroma) -> persist metadata. + knowledge browse."""
import io
import hashlib
from typing import List, Optional
from pypdf import PdfReader
from config import CHUNK_SIZE, CHUNK_OVERLAP
from domain import Document, RetrievedChunk
from vector_store import get_vector_store
import repositories as repo


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    text = " ".join(text.split())
    if not text:
        return []
    chunks, start = [], 0
    while start < len(text):
        end = min(len(text), start + size)
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


async def ingest_document(title: str, domain: str, text: str, source: Optional[str],
                          language: str = "en", origin: str = "seed") -> Document:
    doc = Document(title=title, domain=domain, source=source, language=language, origin=origin)
    chunks = chunk_text(text)
    ids, docs, metas = [], [], []
    for i, ch in enumerate(chunks):
        cid = hashlib.sha1(f"{doc.id}-{i}".encode()).hexdigest()
        ids.append(cid)
        docs.append(ch)
        metas.append({"document_id": doc.id, "title": title, "domain": domain,
                      "source": source or "", "language": language, "chunk_index": i})
    get_vector_store().add(ids, docs, metas)
    doc.chunk_count = len(chunks)
    await repo.add_document(doc)
    return doc


async def ingest_upload(filename: str, data: bytes, domain: str, language: str) -> Document:
    if filename.lower().endswith(".pdf"):
        text = extract_pdf(data)
    else:
        text = data.decode("utf-8", errors="ignore")
    if not text.strip():
        from errors import ValidationError
        raise ValidationError("Could not extract any text from the file.")
    title = filename.rsplit(".", 1)[0]
    return await ingest_document(title, domain, text, source=filename,
                                 language=language, origin="upload")


def semantic_preview(query: str, k: int = 6, domain: Optional[str] = None) -> List[RetrievedChunk]:
    where = {"domain": domain} if domain else None
    return get_vector_store().query(query, k=k, where=where)


async def delete_document(doc_id: str):
    get_vector_store().delete_document(doc_id)
    await repo.delete_document(doc_id)
