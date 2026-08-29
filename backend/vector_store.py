"""ChromaDB adapter implementing IVectorStore. Embedded, offline-friendly (MiniLM ONNX)."""
from typing import List, Optional
import chromadb
from config import CHROMA_DIR, KB_COLLECTION
from domain import RetrievedChunk


class ChromaVectorStore:
    def __init__(self):
        self._client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self._col = self._client.get_or_create_collection(
            name=KB_COLLECTION, metadata={"hnsw:space": "cosine"}
        )

    def add(self, ids: List[str], texts: List[str], metadatas: List[dict]) -> None:
        if not ids:
            return
        self._col.add(ids=ids, documents=texts, metadatas=metadatas)

    def query(self, text: str, k: int, where: Optional[dict] = None) -> List[RetrievedChunk]:
        res = self._col.query(
            query_texts=[text], n_results=k,
            where=where or None,
            include=["documents", "metadatas", "distances"],
        )
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        out: List[RetrievedChunk] = []
        for doc, meta, dist in zip(docs, metas, dists):
            similarity = 1.0 - float(dist)  # cosine distance -> similarity
            out.append(RetrievedChunk(
                document_id=meta.get("document_id", ""),
                title=meta.get("title", ""),
                domain=meta.get("domain", ""),
                source=meta.get("source"),
                text=doc,
                score=max(0.0, min(1.0, similarity)),
                chunk_index=int(meta.get("chunk_index", 0)),
            ))
        return out

    def count(self) -> int:
        return self._col.count()

    def delete_document(self, document_id: str) -> None:
        self._col.delete(where={"document_id": document_id})


_store: Optional[ChromaVectorStore] = None


def get_vector_store() -> ChromaVectorStore:
    global _store
    if _store is None:
        _store = ChromaVectorStore()
    return _store
