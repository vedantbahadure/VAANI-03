"""One-off cleanup for TEST_ documents created during QA (no DELETE /api/documents endpoint exists)."""
import asyncio
import sys

sys.path.insert(0, "/app/backend")

import repositories as repo  # noqa: E402
from db import get_db, close_db  # noqa: E402
from vector_store import get_vector_store  # noqa: E402


async def main():
    docs = await repo.list_documents()
    targets = [d for d in docs if d.title.startswith("TEST_")]
    store = get_vector_store()
    db = await get_db()
    for d in targets:
        store.delete_document(d.id)
        await db.execute("DELETE FROM documents WHERE id = ?", (d.id,))
        print("deleted", d.id, d.title)
    await db.commit()
    print("remaining documents:", len(await repo.list_documents()), "vectors:", store.count())
    await close_db()


asyncio.run(main())
