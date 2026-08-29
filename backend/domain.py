"""Domain models + infrastructure interfaces (Protocols) for dependency inversion."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Protocol, AsyncIterator
from pydantic import BaseModel, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- Domain models ----------
class Citation(BaseModel):
    n: int
    document_id: str
    title: str
    domain: str
    source: Optional[str] = None
    snippet: str


class Message(BaseModel):
    id: str = Field(default_factory=new_id)
    conversation_id: str
    role: str  # user | assistant
    content: str
    language: Optional[str] = None
    confidence: Optional[float] = None
    grounded: Optional[bool] = None
    citations: List[Citation] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)


class Conversation(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    language: str = "en"
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class Document(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    domain: str
    source: Optional[str] = None
    language: Optional[str] = "en"
    chunk_count: int = 0
    origin: str = "seed"  # seed | upload
    created_at: str = Field(default_factory=now_iso)


class Bookmark(BaseModel):
    id: str = Field(default_factory=new_id)
    message_id: str
    conversation_id: str
    note: Optional[str] = None
    content: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class RetrievedChunk(BaseModel):
    document_id: str
    title: str
    domain: str
    source: Optional[str] = None
    text: str
    score: float
    chunk_index: int = 0


# ---------- Infrastructure interfaces ----------
class IVectorStore(Protocol):
    def add(self, ids: List[str], texts: List[str], metadatas: List[dict]) -> None: ...
    def query(self, text: str, k: int, where: Optional[dict] = None) -> List[RetrievedChunk]: ...
    def count(self) -> int: ...
    def delete_document(self, document_id: str) -> None: ...


class ILLM(Protocol):
    async def stream(self, system: str, prompt: str, session_id: str) -> AsyncIterator[str]: ...


class ISTT(Protocol):
    async def transcribe(self, audio_bytes: bytes, filename: str, language: Optional[str]) -> str: ...


class ITTS(Protocol):
    async def synthesize(self, text: str, voice: str) -> bytes: ...
