"""VAANI backend regression suite: health/system, RAG chat SSE, conversations,
knowledge, voice TTS, documents upload+ask, bookmarks, hardware."""
import io
import json

import pytest
import requests

from conftest import BASE_URL

SSE_TIMEOUT = 180


def parse_sse(resp):
    """Parse an SSE response into a list of (event, data_dict)."""
    events = []
    event_name = None
    for raw in resp.iter_lines(decode_unicode=True):
        if raw is None:
            continue
        line = raw.strip("\r")
        if line.startswith("event:"):
            event_name = line.split(":", 1)[1].strip()
        elif line.startswith("data:"):
            payload = line.split(":", 1)[1].strip()
            try:
                data = json.loads(payload)
            except Exception:
                data = {"raw": payload}
            events.append((event_name or "message", data))
        elif line == "":
            event_name = None
    return events


def stream_chat(message, language="en", conversation_id=None):
    body = {"message": message, "language": language}
    if conversation_id:
        body["conversation_id"] = conversation_id
    r = requests.post(f"{BASE_URL}/api/chat/stream", json=body, stream=True, timeout=SSE_TIMEOUT)
    assert r.status_code == 200, f"chat/stream status {r.status_code}: {r.text[:300]}"
    assert "text/event-stream" in r.headers.get("content-type", "")
    evs = parse_sse(r)
    meta = next((d for n, d in evs if n == "meta"), None)
    tokens = [d for n, d in evs if n == "token"]
    done = next((d for n, d in evs if n == "done"), None)
    errors = [d for n, d in evs if n == "error"]
    answer = "".join(t.get("delta", "") for t in tokens)
    return meta, answer, done, errors


# ---------------- Health & System ----------------
class TestHealthSystem:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "ok"
        assert d["service"] == "vaani"

    def test_system_status(self, api):
        r = api.get(f"{BASE_URL}/api/system/status", timeout=60)
        assert r.status_code == 200
        d = r.json()
        for key in ("llm", "stt", "tts", "vector_store", "database"):
            assert d["subsystems"][key]["status"] == "online", f"{key} not online"
        k = d["knowledge"]
        assert k["documents"] >= 12, f"documents={k['documents']}"
        assert k["vectors"] >= 24, f"vectors={k['vectors']}"
        assert len(k["domains"]) >= 8, f"domains={k['domains']}"
        assert set(d["languages"].keys()) == {"en", "hi", "mr"}

    def test_hardware_capabilities(self, api):
        r = api.get(f"{BASE_URL}/api/hardware/capabilities", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["adapter"] == "mock"
        assert isinstance(d["capabilities"], dict) and len(d["capabilities"]) > 0


# ---------------- Chat RAG streaming ----------------
class TestChatRag:
    def test_grounded_pmkisan(self):
        meta, answer, done, errors = stream_chat(
            "How much money do I get under PM-KISAN and how is it paid?", "en")
        assert not errors, f"SSE errors: {errors}"
        assert meta is not None, "no meta event"
        assert meta["grounded"] is True
        assert meta["confidence"] > 0
        assert len(meta["citations"]) > 0, "citations empty"
        titles = " ".join(c["title"] for c in meta["citations"]).lower()
        assert "kisan" in titles, f"PM-KISAN not cited: {titles}"
        assert len(answer) > 50, f"answer too short: {answer!r}"
        assert "6,000" in answer or "6000" in answer, f"missing Rs 6000: {answer[:400]}"
        assert done and done.get("message_id") and done.get("conversation_id")

    def test_offtopic_not_grounded(self):
        meta, answer, done, errors = stream_chat("What is the capital of France?", "en")
        assert not errors, f"SSE errors: {errors}"
        assert meta["grounded"] is False, f"off-topic wrongly grounded: {meta}"
        assert len(meta["citations"]) == 0
        assert len(answer) > 10

    def test_empty_message_validation(self, api):
        r = api.post(f"{BASE_URL}/api/chat/stream", json={"message": "   "}, timeout=30)
        assert r.status_code in (400, 422), f"got {r.status_code}"

    def test_hindi_question_returns_devanagari(self):
        meta, answer, done, errors = stream_chat(
            "पीएम किसान योजना में कितने पैसे मिलते हैं?", "hi")
        assert not errors, f"SSE errors: {errors}"
        assert meta["language"] == "hi"
        assert any("\u0900" <= ch <= "\u097F" for ch in answer), f"not Devanagari: {answer[:200]}"


# ---------------- Conversations persistence ----------------
class TestConversations:
    def test_conversation_persisted_with_citations(self, api):
        meta, answer, done, errors = stream_chat("What is PMFBY crop insurance premium?", "en")
        assert not errors
        conv_id = done["conversation_id"]

        lst = api.get(f"{BASE_URL}/api/conversations", timeout=30)
        assert lst.status_code == 200
        ids = [c["id"] for c in lst.json()]
        assert conv_id in ids

        det = api.get(f"{BASE_URL}/api/conversations/{conv_id}", timeout=30)
        assert det.status_code == 200
        d = det.json()
        assert d["conversation"]["id"] == conv_id
        msgs = d["messages"]
        assert len(msgs) >= 2
        assert msgs[0]["role"] == "user"
        assistant = [m for m in msgs if m["role"] == "assistant"]
        assert assistant, "no assistant message stored"
        a = assistant[-1]
        assert a["confidence"] and a["confidence"] > 0
        assert len(a["citations"]) > 0
        assert "_id" not in a

        # follow-up in same conversation
        meta2, _, done2, err2 = stream_chat("And who is eligible?", "en", conversation_id=conv_id)
        assert not err2
        assert done2["conversation_id"] == conv_id
        det2 = api.get(f"{BASE_URL}/api/conversations/{conv_id}", timeout=30).json()
        assert len(det2["messages"]) >= 4

        # cleanup
        dele = api.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=30)
        assert dele.status_code in (200, 204)
        assert api.get(f"{BASE_URL}/api/conversations/{conv_id}", timeout=30).status_code == 404

    def test_get_unknown_conversation_404(self, api):
        r = api.get(f"{BASE_URL}/api/conversations/does-not-exist-xyz", timeout=30)
        assert r.status_code == 404

    def test_search_conversations(self, api):
        r = api.get(f"{BASE_URL}/api/conversations/search", params={"q": "PM-KISAN"}, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Knowledge ----------------
class TestKnowledge:
    def test_list_knowledge(self, api):
        r = api.get(f"{BASE_URL}/api/knowledge", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 12
        d = docs[0]
        for f in ("id", "title", "domain", "chunk_count"):
            assert f in d, f"missing field {f}"
        assert "_id" not in d

    def test_knowledge_domain_filter(self, api):
        r = api.get(f"{BASE_URL}/api/knowledge", params={"domain": "schemes"}, timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) > 0
        assert all(x["domain"] == "schemes" for x in docs)

    def test_domains(self, api):
        r = api.get(f"{BASE_URL}/api/knowledge/domains", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d) >= 8
        assert all(isinstance(v, int) and v > 0 for v in d.values())

    def test_semantic_search_ranked(self, api):
        r = api.get(f"{BASE_URL}/api/knowledge/search",
                    params={"q": "crop insurance premium"}, timeout=60)
        assert r.status_code == 200
        res = r.json()
        assert len(res) > 0
        scores = [c["score"] for c in res]
        assert scores == sorted(scores, reverse=True), f"not ranked: {scores}"
        assert scores[0] > 0
        top = res[0]["title"].lower()
        assert "fasal" in top or "pmfby" in top or "insurance" in top, f"top={res[0]['title']}"


# ---------------- Voice ----------------
class TestVoice:
    def test_tts(self, api):
        r = api.post(f"{BASE_URL}/api/voice/speak", json={"text": "Namaste"}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        assert r.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r.content) > 500, f"audio too small: {len(r.content)}"

    def test_tts_empty_text(self, api):
        r = api.post(f"{BASE_URL}/api/voice/speak", json={"text": ""}, timeout=60)
        assert r.status_code in (400, 422)

    def test_transcribe_empty_audio(self, api):
        r = requests.post(f"{BASE_URL}/api/voice/transcribe",
                          files={"audio": ("a.webm", b"", "audio/webm")}, timeout=60)
        assert r.status_code in (400, 422)


# ---------------- Documents ----------------
@pytest.fixture(scope="class")
def uploaded_doc(api):
    content = (
        "TEST_ Gram Panchayat Water Tax Circular 2026.\n"
        "The annual water tax for a household in TEST_ village is Rs 480 per year, "
        "payable in two instalments of Rs 240 each at the Gram Panchayat office. "
        "Late payment attracts a penalty of 2 percent per month. "
        "Contact the Gram Sevak for a receipt.\n"
    ) * 3
    r = requests.post(
        f"{BASE_URL}/api/documents/upload",
        files={"file": ("TEST_water_tax.txt", io.BytesIO(content.encode()), "text/plain")},
        data={"domain": "faq", "language": "en"}, timeout=120)
    assert r.status_code == 200, f"upload failed {r.status_code}: {r.text[:300]}"
    doc = r.json()
    yield doc


class TestDocuments:
    def test_upload_and_list(self, api, uploaded_doc):
        assert uploaded_doc["chunk_count"] > 0
        assert uploaded_doc["origin"] == "upload"
        assert uploaded_doc["domain"] == "faq"
        lst = api.get(f"{BASE_URL}/api/documents", timeout=30)
        assert lst.status_code == 200
        ids = [d["id"] for d in lst.json()]
        assert uploaded_doc["id"] in ids
        assert all(d["origin"] == "upload" for d in lst.json())

    def test_ask_document(self, uploaded_doc):
        r = requests.post(f"{BASE_URL}/api/documents/{uploaded_doc['id']}/ask",
                          json={"message": "How much is the annual water tax and in how many instalments?",
                                "language": "en"}, stream=True, timeout=SSE_TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        evs = parse_sse(r)
        meta = next((d for n, d in evs if n == "meta"), None)
        answer = "".join(d.get("delta", "") for n, d in evs if n == "token")
        errors = [d for n, d in evs if n == "error"]
        assert not errors, errors
        assert meta and meta["grounded"] is True
        assert len(meta["citations"]) > 0
        assert uploaded_doc["id"] in [c["document_id"] for c in meta["citations"]]
        assert "480" in answer, f"doc fact missing: {answer[:400]}"

    def test_ask_unknown_document_404(self, api):
        r = api.post(f"{BASE_URL}/api/documents/nope-xyz/ask",
                     json={"message": "hi"}, timeout=30)
        assert r.status_code == 404


# ---------------- Bookmarks ----------------
class TestBookmarks:
    def test_bookmark_crud(self, api):
        payload = {"message_id": "TEST_msg_1", "conversation_id": "TEST_conv_1",
                   "content": "TEST_ bookmark content", "note": "TEST_note"}
        c = api.post(f"{BASE_URL}/api/bookmarks", json=payload, timeout=30)
        assert c.status_code == 200, c.text[:300]
        bm = c.json()
        assert bm["message_id"] == payload["message_id"]
        assert bm["content"] == payload["content"]
        assert "id" in bm and "_id" not in bm

        lst = api.get(f"{BASE_URL}/api/bookmarks", timeout=30)
        assert lst.status_code == 200
        assert bm["id"] in [b["id"] for b in lst.json()]

        d = api.delete(f"{BASE_URL}/api/bookmarks/{bm['id']}", timeout=30)
        assert d.status_code in (200, 204)
        assert bm["id"] not in [b["id"] for b in api.get(f"{BASE_URL}/api/bookmarks", timeout=30).json()]
