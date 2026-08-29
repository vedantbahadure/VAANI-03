# VAANI — AI Operating System for Rural Governance
### Codename: Project Genesis

VAANI is a trust-first, voice-native, multilingual (Marathi · Hindi · English) AI assistant that
bridges rural citizens and government services. It answers questions on government schemes,
cooperative law, PACS, crop insurance, agriculture and financial literacy using
**Retrieval-Augmented Generation** — every answer is grounded in verified documents, always cited,
always with a confidence indicator.

## Highlights
- **Trust-first RAG** — answers generated strictly from retrieved documents when verified evidence
  exists (grounding threshold gate), with visible citations + confidence score.
- **Voice-first** — OpenAI Whisper (STT) + OpenAI TTS, warm spoken replies.
- **Multilingual** — Marathi / Hindi / English, with cross-lingual retrieval (query translation).
- **Living Orb** — the soul of VAANI, a breathing sphere with 7 states.
- **Cinematic landing** — React Three Fiber + GSAP + Lenis + Framer Motion; a scroll-story of 10 chapters.
- **Clean architecture** — routers → services → repositories/adapters, dependency inversion via Protocols.
- **Hardware-ready** — abstraction layer for laptop / Raspberry Pi / ESP32 (adapters only change).
- **Showcase vs Device mode** — full 3D/bloom for demos, lightweight for Raspberry Pi kiosks.

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind, Framer Motion, R3F/Three.js, GSAP, Lenis, shadcn/ui |
| Backend | FastAPI (async), Clean Architecture, SSE streaming |
| Relational DB | SQLite (repository-abstracted → PostgreSQL-ready) |
| Vector DB | ChromaDB (embedded, offline-friendly) |
| LLM | Gemini 3.1 Pro (via Emergent Universal Key) |
| Voice | OpenAI Whisper (STT) + OpenAI TTS |

## Architecture
See [`docs/SDD.md`](docs/SDD.md) for the full Software Design Document (27 sections).

```
Speech → Language Detect → Query Translate → Embed → Vector Search → Retrieved Docs
       → Gemini (grounded) → Verified Answer (cited, confidence) → Voice Output
```

## Running locally
Backend (:8001) and Frontend (:3000) are supervisor-managed.
```bash
sudo supervisorctl restart backend frontend
```
Data (SQLite + ChromaDB) persists in `/app/data`. The knowledge base auto-seeds 12 verified
documents on first startup.

## API (prefix `/api`)
`/health` · `/system/status` · `/chat/stream` (SSE) · `/conversations[/{id}]` · `/conversations/search`
· `/voice/transcribe` · `/voice/speak` · `/knowledge[/domains|/search]` · `/documents[/upload|/{id}|/{id}/ask]`
· `/bookmarks` · `/hardware/capabilities`

## Tests
```bash
pytest backend/tests/ -v
```

## Docker
```bash
docker compose up --build
```
