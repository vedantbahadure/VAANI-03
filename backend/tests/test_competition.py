"""Competition Edition additions: POST /api/translate + regression on grounded flag
persistence, TTS, knowledge search and documents delete."""
import io
import json

import pytest
import requests

from conftest import BASE_URL
from backend_test import stream_chat


# ---------------- NEW: POST /api/translate ----------------
class TestTranslate:
    def test_translate_en_to_hi(self, api):
        r = api.post(f"{BASE_URL}/api/translate",
                     json={"text": "You get Rs 6000 per year under PM-KISAN in three instalments.",
                           "target": "hi"}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["target"] == "hi"
        assert isinstance(d["text"], str) and len(d["text"]) > 0
        # Must actually contain Devanagari
        assert any("\u0900" <= ch <= "\u097F" for ch in d["text"]), f"not Devanagari: {d['text'][:120]}"

    def test_translate_hi_to_en(self, api):
        r = api.post(f"{BASE_URL}/api/translate",
                     json={"text": "पीएम-किसान के तहत मुझे सालाना छह हजार रुपये मिलते हैं।",
                           "target": "en"}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["target"] == "en"
        assert len(d["text"]) > 0
        assert not any("\u0900" <= ch <= "\u097F" for ch in d["text"]), d["text"][:120]

    def test_translate_empty_text_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/translate", json={"text": "   ", "target": "hi"}, timeout=60)
        assert r.status_code in (400, 422), f"expected 4xx, got {r.status_code}: {r.text[:200]}"

    def test_translate_missing_text_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/translate", json={"target": "hi"}, timeout=60)
        assert r.status_code == 422

    def test_translate_default_target_is_en(self, api):
        r = api.post(f"{BASE_URL}/api/translate", json={"text": "मैं किसान हूँ।"}, timeout=120)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["target"] == "en"


# ---------------- REGRESSION: grounded + confidence persistence ----------------
class TestGroundedPersistence:
    def test_grounded_flag_survives_persistence(self, api):
        meta, answer, done, errors = stream_chat("How much money do I get under PM-KISAN?")
        assert not errors, errors
        assert meta is not None
        assert meta.get("grounded") is True, meta
        assert len(meta.get("citations", [])) > 0
        conf = meta.get("confidence")
        assert isinstance(conf, (int, float)) and conf >= 0.75, f"confidence not in High band: {conf}"
        conv_id = done["conversation_id"]

        g = api.get(f"{BASE_URL}/api/conversations/{conv_id}", timeout=60)
        assert g.status_code == 200
        msgs = g.json()["messages"]
        assistant = [m for m in msgs if m["role"] == "assistant"]
        assert assistant, msgs
        last = assistant[-1]
        assert last.get("grounded") is True, f"grounded lost on persistence: {last}"
        assert len(last.get("citations") or []) > 0
        assert "_id" not in last
        api.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=30)

    def test_hindi_grounded_and_devanagari(self, api):
        meta, answer, done, errors = stream_chat("पीएम-किसान योजना में मुझे कितने पैसे मिलते हैं?", language="hi")
        assert not errors, errors
        assert meta.get("grounded") is True, meta
        assert any("\u0900" <= ch <= "\u097F" for ch in answer), answer[:150]
        api.delete(f"{BASE_URL}/api/conversations/{done['conversation_id']}", timeout=30)


# ---------------- REGRESSION: TTS used by read-aloud/word highlight ----------------
class TestTTS:
    def test_speak_returns_audio(self, api):
        r = api.post(f"{BASE_URL}/api/voice/speak",
                     json={"text": "Under PM-KISAN you receive six thousand rupees a year.", "voice": "alloy"},
                     timeout=120)
        assert r.status_code == 200, r.text[:200]
        assert r.headers.get("content-type") == "audio/mpeg"
        assert len(r.content) > 1000

    def test_speak_empty_rejected(self, api):
        r = api.post(f"{BASE_URL}/api/voice/speak", json={"text": ""}, timeout=60)
        assert r.status_code in (400, 422)


# ---------------- NEW: DELETE /api/documents/{id} + doc ask ----------------
class TestDocumentLifecycle:
    def test_upload_ask_and_delete(self, api):
        content = (
            "TEST_COMP_DOC\nVillage Water Tax Notice 2026.\n"
            "The annual water tax for each household is Rs 240, payable in two instalments of Rs 120.\n"
            "Late payment attracts a penalty of Rs 20 per month. Pay at the Gram Panchayat office.\n"
        )
        files = {"file": ("TEST_comp_water.txt", io.BytesIO(content.encode()), "text/plain")}
        r = requests.post(f"{BASE_URL}/api/documents/upload", files=files,
                          data={"domain": "faq", "language": "en"}, timeout=180)
        assert r.status_code in (200, 201), r.text[:300]
        doc = r.json()
        doc_id = doc["id"]
        assert doc["chunk_count"] >= 1

        lst = api.get(f"{BASE_URL}/api/documents", timeout=60)
        assert lst.status_code == 200
        assert any(d["id"] == doc_id for d in lst.json())

        ask = requests.post(f"{BASE_URL}/api/documents/{doc_id}/ask",
                            json={"message": "How much is the annual water tax?", "language": "en"},
                            stream=True, timeout=180)
        assert ask.status_code == 200, ask.text[:200]
        from backend_test import parse_sse
        evs = parse_sse(ask)
        meta = next((d for n, d in evs if n == "meta"), None)
        answer = "".join(d.get("delta", "") for n, d in evs if n == "token")
        assert meta is not None and len(meta.get("citations", [])) > 0, meta
        assert "240" in answer, answer[:300]

        d = api.delete(f"{BASE_URL}/api/documents/{doc_id}", timeout=60)
        assert d.status_code in (200, 204), f"delete failed {d.status_code}: {d.text[:200]}"

        lst2 = api.get(f"{BASE_URL}/api/documents", timeout=60)
        assert all(x["id"] != doc_id for x in lst2.json()), "document still listed after delete"

    def test_delete_nonexistent_document(self, api):
        r = api.delete(f"{BASE_URL}/api/documents/does-not-exist-123", timeout=60)
        assert r.status_code in (404, 400), r.status_code


# ---------------- REGRESSION: knowledge + status ----------------
class TestKnowledgeStatusRegression:
    def test_knowledge_list_and_search(self, api):
        r = api.get(f"{BASE_URL}/api/knowledge", timeout=60)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list) and len(docs) > 0
        assert '"_id"' not in json.dumps(docs)

        s = api.get(f"{BASE_URL}/api/knowledge/search", params={"q": "crop insurance premium"}, timeout=120)
        assert s.status_code == 200, s.text[:200]
        res = s.json()
        items = res if isinstance(res, list) else res.get("results", [])
        assert len(items) > 0, res

    def test_system_status(self, api):
        r = api.get(f"{BASE_URL}/api/system/status", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "subsystems" in d or "hardware" in d, d
