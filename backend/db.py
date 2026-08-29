"""SQLite connection + schema migration (aiosqlite). PostgreSQL-portable SQL."""
import aiosqlite
from config import SQLITE_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT,
  confidence REAL,
  grounded INTEGER,
  citations TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  source TEXT,
  language TEXT,
  chunk_count INTEGER DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  note TEXT,
  content TEXT,
  created_at TEXT NOT NULL
);
"""

_conn: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    global _conn
    if _conn is None:
        _conn = await aiosqlite.connect(str(SQLITE_PATH))
        _conn.row_factory = aiosqlite.Row
        await _conn.execute("PRAGMA foreign_keys=ON;")
        await _conn.executescript(SCHEMA)
        try:
            await _conn.execute("ALTER TABLE messages ADD COLUMN grounded INTEGER")
        except Exception:
            pass
        await _conn.commit()
    return _conn


async def close_db():
    global _conn
    if _conn is not None:
        await _conn.close()
        _conn = None
