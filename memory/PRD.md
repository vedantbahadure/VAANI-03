# VAANI — Product Requirements Document (living)

## Original problem statement
Build VAANI (Project Genesis): a premium, trust-first AI operating system for rural governance in
India — the digital bridge between citizens and government services. Voice interaction, multilingual
conversation (Marathi/Hindi/English), government scheme guidance, cooperative law, crop insurance,
financial literacy, agriculture, document explanation & QA, conversation memory, offline-friendly,
hardware-ready. Cinematic 3D landing (Living Orb, particles, scroll-story) + usable functional app.
RAG with citations + confidence; never fabricate when verified docs exist.

## User choices
- LLM: Gemini 3.1 Pro (Emergent Universal Key)
- Voice: OpenAI Whisper (STT) + OpenAI TTS
- Priority: BOTH cinematic landing AND functional chat app
- Data: SQLite (repo-abstracted, PostgreSQL-ready) + ChromaDB (vectors). NOT MongoDB.
- Knowledge domains seeded: schemes, insurance, PACS, cooperative, finance, agriculture, circulars, FAQs

## Architecture
Clean Architecture: routers → services → repositories/adapters; infra behind Protocols.
Backend FastAPI (flat modules): config, errors, domain, db, repositories, vector_store, ai_adapters,
rag, ingest, hardware, seed_knowledge, server. Data at /app/data. SSE streaming for chat.
Frontend React 19: lib (api/i18n/contexts/useVoice/domains), components (Orb, OrbCanvas, ParticleField,
Controls, RichText, ConfidenceBadge, CitationCard, ErrorBoundary), landing (Landing, CinematicIntro),
app (AppShell + Home/Chat/Knowledge/Documents/History/Settings/SystemStatus).

## User personas
Farmers, cooperative members, PACS staff, village officers, government employees, rural citizens —
many new to AI. No-login kiosk model for accessibility.

## Core requirements (static)
Trust · Simplicity · Performance · User Delight. Grounded RAG with citations + confidence.
Multilingual voice-first. Premium calm design. Hardware abstraction. Offline-friendly.

## Implemented (2026-06)
- [x] Backend RAG pipeline: retrieve → grounding gate → Gemini stream → citations + confidence
- [x] Cross-lingual retrieval via query translation (Hindi/Marathi → English search)
- [x] Confidence calibration (High band reachable for strong grounded answers)
- [x] Voice: /voice/transcribe (Whisper) + /voice/speak (OpenAI TTS)
- [x] SQLite repos (conversations, messages incl. grounded flag, documents, bookmarks) + ChromaDB
- [x] Seeded knowledge base: 12 verified documents across 8 domains
- [x] Document upload (PDF/TXT) + per-document QA + delete (SQLite + vectors)
- [x] Hardware abstraction (mock/laptop/raspberry_pi/esp32) + capabilities endpoint
- [x] Cinematic intro (particle awakening → Living Orb → "Hello, I'm VAANI"), skippable
- [x] Scroll-story landing (10 chapters), Lenis smooth scroll, R3F Living Orb, particle field, parallax
- [x] App: Home, Chat (stream/voice/citations/confidence/bookmarks/TTS/lang), Knowledge (browse+semantic
      search+domain filter), Documents, History (search+bookmarks+delete), Settings (theme/lang/voice/mode),
      System Status (subsystems, RAG pipeline, KB breakdown, hardware)
- [x] Dark/Light themes, 3 languages (Devanagari fonts), online/offline indicator, skeletons, empty/error states
- [x] Docker (backend/frontend/compose), README, full SDD (docs/SDD.md), pytest suite (21 tests passing)

## Verification
- Backend: 21/21 pytest passing; RAG/voice/knowledge/docs/bookmarks curl-verified.
- Frontend: all screens/flows functional. HIGH bugs fixed & re-verified (grounded persists on reload;
  mobile composer padding above dock). Confidence EN 0.95 / Hindi 0.99 grounded, 5 citations.

## Backlog (prioritized)
- P1: Word-level voice highlighting during TTS playback; PWA/service-worker offline cache of app shell
- P1: Multilingual embedding model (blocked: torch too heavy for current env — using translation instead)
- P2: OCR ingestion for scanned documents (ITesseract adapter seam exists)
- P2: Optional JWT/Google auth adapter (IAuth seam); web-sync of KB from official sources
- P2: Live GPIO/serial Raspberry Pi + ESP32 adapters; orphan-conversation cleanup on LLM failure
- P2: Streaming TTS; conversation export/share

## Next tasks
Gather user feedback on the demo; prioritize offline PWA cache and voice-highlight if pursuing SIH polish.
