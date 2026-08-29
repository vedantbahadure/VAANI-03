"""Repository layer: all SQL isolated here (swap DB engine without touching services)."""
import json
from typing import List, Optional
from db import get_db
from domain import Conversation, Message, Document, Bookmark, Citation, now_iso


# ---------- Conversations & Messages ----------
async def create_conversation(conv: Conversation) -> Conversation:
    db = await get_db()
    await db.execute(
        "INSERT INTO conversations (id,title,language,created_at,updated_at) VALUES (?,?,?,?,?)",
        (conv.id, conv.title, conv.language, conv.created_at, conv.updated_at),
    )
    await db.commit()
    return conv


async def touch_conversation(conv_id: str, title: Optional[str] = None):
    db = await get_db()
    if title:
        await db.execute("UPDATE conversations SET updated_at=?, title=? WHERE id=?", (now_iso(), title, conv_id))
    else:
        await db.execute("UPDATE conversations SET updated_at=? WHERE id=?", (now_iso(), conv_id))
    await db.commit()


async def list_conversations() -> List[Conversation]:
    db = await get_db()
    cur = await db.execute("SELECT * FROM conversations ORDER BY updated_at DESC")
    rows = await cur.fetchall()
    return [Conversation(**dict(r)) for r in rows]


async def get_conversation(conv_id: str) -> Optional[Conversation]:
    db = await get_db()
    cur = await db.execute("SELECT * FROM conversations WHERE id=?", (conv_id,))
    row = await cur.fetchone()
    return Conversation(**dict(row)) if row else None


async def delete_conversation(conv_id: str):
    db = await get_db()
    await db.execute("DELETE FROM messages WHERE conversation_id=?", (conv_id,))
    await db.execute("DELETE FROM conversations WHERE id=?", (conv_id,))
    await db.commit()


async def add_message(msg: Message) -> Message:
    db = await get_db()
    await db.execute(
        "INSERT INTO messages (id,conversation_id,role,content,language,confidence,grounded,citations,created_at) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (msg.id, msg.conversation_id, msg.role, msg.content, msg.language,
         msg.confidence, (None if msg.grounded is None else int(msg.grounded)),
         json.dumps([c.model_dump() for c in msg.citations]), msg.created_at),
    )
    await db.commit()
    return msg


def _row_to_message(r) -> Message:
    d = dict(r)
    cits = json.loads(d.get("citations") or "[]")
    d["citations"] = [Citation(**c) for c in cits]
    if d.get("grounded") is not None:
        d["grounded"] = bool(d["grounded"])
    return Message(**d)


async def list_messages(conv_id: str) -> List[Message]:
    db = await get_db()
    cur = await db.execute("SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC", (conv_id,))
    return [_row_to_message(r) for r in await cur.fetchall()]


async def recent_messages(conv_id: str, limit: int = 8) -> List[Message]:
    db = await get_db()
    cur = await db.execute(
        "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT ?", (conv_id, limit))
    rows = list(await cur.fetchall())[::-1]
    return [_row_to_message(r) for r in rows]


async def search_messages(q: str) -> List[dict]:
    db = await get_db()
    cur = await db.execute(
        "SELECT m.id,m.conversation_id,m.role,m.content,m.created_at,c.title "
        "FROM messages m JOIN conversations c ON c.id=m.conversation_id "
        "WHERE m.content LIKE ? ORDER BY m.created_at DESC LIMIT 50", (f"%{q}%",))
    return [dict(r) for r in await cur.fetchall()]


# ---------- Documents ----------
async def add_document(doc: Document) -> Document:
    db = await get_db()
    await db.execute(
        "INSERT INTO documents (id,title,domain,source,language,chunk_count,origin,created_at) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (doc.id, doc.title, doc.domain, doc.source, doc.language, doc.chunk_count, doc.origin, doc.created_at),
    )
    await db.commit()
    return doc


async def list_documents(domain: Optional[str] = None) -> List[Document]:
    db = await get_db()
    if domain:
        cur = await db.execute("SELECT * FROM documents WHERE domain=? ORDER BY created_at DESC", (domain,))
    else:
        cur = await db.execute("SELECT * FROM documents ORDER BY created_at DESC")
    return [Document(**dict(r)) for r in await cur.fetchall()]


async def get_document(doc_id: str) -> Optional[Document]:
    db = await get_db()
    cur = await db.execute("SELECT * FROM documents WHERE id=?", (doc_id,))
    row = await cur.fetchone()
    return Document(**dict(row)) if row else None


async def delete_document(doc_id: str):
    db = await get_db()
    await db.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    await db.commit()


async def domain_counts() -> dict:
    db = await get_db()
    cur = await db.execute("SELECT domain, COUNT(*) c FROM documents GROUP BY domain")
    return {r["domain"]: r["c"] for r in await cur.fetchall()}


async def document_count() -> int:
    db = await get_db()
    cur = await db.execute("SELECT COUNT(*) c FROM documents")
    return (await cur.fetchone())["c"]


# ---------- Bookmarks ----------
async def add_bookmark(bm: Bookmark) -> Bookmark:
    db = await get_db()
    await db.execute(
        "INSERT INTO bookmarks (id,message_id,conversation_id,note,content,created_at) VALUES (?,?,?,?,?,?)",
        (bm.id, bm.message_id, bm.conversation_id, bm.note, bm.content, bm.created_at),
    )
    await db.commit()
    return bm


async def list_bookmarks() -> List[Bookmark]:
    db = await get_db()
    cur = await db.execute("SELECT * FROM bookmarks ORDER BY created_at DESC")
    return [Bookmark(**dict(r)) for r in await cur.fetchall()]


async def delete_bookmark(bm_id: str):
    db = await get_db()
    await db.execute("DELETE FROM bookmarks WHERE id=?", (bm_id,))
    await db.commit()
