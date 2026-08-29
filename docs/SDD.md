# VAANI — Software Design Document (SDD) & Technical Architecture
### Codename: PROJECT GENESIS · Build Mode: Flagship

> A premium AI operating system for rural governance in India — the digital bridge
> between citizens and government services. Trust-first RAG, voice-native, multilingual
> (Marathi / Hindi / English), cinematic on the landing page, effortless inside the app.

The four laws every decision must serve: **Trust · Simplicity · Performance · User Delight.**

---

## 1. Overall System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + TS)                        │
│                                                                        │
│  ┌────────────────────────┐        ┌───────────────────────────────┐  │
│  │  SHOWCASE MODE (Landing) │        │      DEVICE MODE (App)         │  │
│  │  R3F · GSAP · Lenis      │        │  Chat · Knowledge · Docs ·     │  │
│  │  Living Orb · Particles  │        │  History · Settings · Status   │  │
│  └────────────────────────┘        └───────────────────────────────┘  │
│                    │  axios / fetch (SSE stream)  │                     │
└────────────────────┼──────────────────────────────┼────────────────────┘
                     │  REST + Server-Sent Events (/api/*)
┌────────────────────▼──────────────────────────────▼────────────────────┐
│                        FastAPI (Clean Architecture)                      │
│                                                                          │
│  API Layer (routers)  →  Service Layer  →  Repository Layer  →  Adapters │
│                                                                          │
│  ┌─ RAG Service ─┐  ┌─ Voice Service ─┐  ┌─ Chat Service ─┐  ┌─ HAL ──┐  │
│  │ retrieve+cite │  │ Whisper / TTS   │  │ session memory │  │ mic... │  │
│  └───────┬───────┘  └────────┬────────┘  └───────┬────────┘  └────────┘  │
└──────────┼───────────────────┼───────────────────┼──────────────────────┘
           │                   │                   │
   ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
   │   ChromaDB    │   │ Emergent LLM  │   │    SQLite     │
   │ (vectors/RAG) │   │ Gemini/Whisper│   │ (relational)  │
   │  embedded     │   │  /TTS gateway │   │ repo-abstract │
   └───────────────┘   └───────────────┘   └───────────────┘
```

**Principles:** Clean Architecture with dependency inversion. Business logic depends on
*interfaces* (Protocols), never on concrete infra. Swapping SQLite→PostgreSQL, ChromaDB→pgvector,
or laptop-mic→ESP32 changes an adapter only — never a service.

---

## 2. Folder Structure

```
/app
├── backend/
│   ├── server.py                 # FastAPI entrypoint, router mounting, CORS, lifespan
│   ├── core/
│   │   ├── config.py             # env-driven settings (mode: showcase/device)
│   │   ├── logging.py            # structured logging
│   │   └── errors.py             # AppError hierarchy + exception handlers
│   ├── domain/
│   │   ├── models.py             # Pydantic domain models (Base, Session, Message, Doc...)
│   │   └── interfaces.py         # Protocols: Repo, VectorStore, LLM, STT, TTS, Hardware
│   ├── repositories/
│   │   ├── db.py                 # SQLite (aiosqlite) connection + schema migration
│   │   ├── session_repo.py       # conversations & messages
│   │   ├── document_repo.py      # ingested documents metadata
│   │   └── bookmark_repo.py      # bookmarks
│   ├── vector/
│   │   └── chroma_store.py       # ChromaDB adapter (VectorStore interface)
│   ├── services/
│   │   ├── rag_service.py        # retrieve → ground → LLM → cite → confidence
│   │   ├── chat_service.py       # session memory, streaming orchestration
│   │   ├── voice_service.py      # Whisper STT + OpenAI TTS
│   │   ├── knowledge_service.py  # KB browse/search
│   │   └── ingest_service.py     # document ingestion + chunk + embed
│   ├── hardware/
│   │   ├── interfaces.py         # Microphone, Speaker, Camera, GPIO, Display protocols
│   │   └── adapters/             # laptop.py, raspberry_pi.py, esp32.py, mock.py
│   ├── routers/
│   │   ├── chat.py  voice.py  knowledge.py  documents.py
│   │   ├── history.py  system.py  hardware.py
│   ├── data/
│   │   ├── seed_knowledge.py     # real seed content (schemes, PACS, insurance...)
│   │   └── vaani.db  chroma/     # runtime data (gitignored)
│   └── tests/                    # pytest unit + integration
├── frontend/
│   └── src/
│       ├── App.js                # router: /  (landing)  /app/*  (application)
│       ├── lib/                  # api client, theme, i18n, hooks
│       ├── landing/              # R3F scenes, Orb, chapters, intro
│       ├── app/                  # Home, Chat, Knowledge, Documents, History, Settings, Status
│       └── components/           # shared UI (Orb mini, nav, cards) + ui/ (shadcn)
├── docs/SDD.md                   # this document
└── docker-compose.yml + Dockerfiles
```

---

## 3. Database Schema (SQLite → PostgreSQL portable)

```sql
-- conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,             -- uuid
  title TEXT NOT NULL,
  language TEXT NOT NULL,          -- en | hi | mr
  created_at TEXT NOT NULL,        -- ISO8601 UTC
  updated_at TEXT NOT NULL
);

-- messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,              -- user | assistant
  content TEXT NOT NULL,
  language TEXT,
  confidence REAL,                 -- 0..1 assistant only
  citations TEXT,                  -- JSON array of citation objects
  created_at TEXT NOT NULL
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- documents (ingested KB + user uploads)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,            -- schemes|cooperative|pacs|insurance|agri|finance|circular|faq
  source TEXT,                     -- gov url / filename
  language TEXT,
  chunk_count INTEGER DEFAULT 0,
  origin TEXT NOT NULL,            -- seed | upload
  created_at TEXT NOT NULL
);

-- bookmarks
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
```

Vector store (ChromaDB) collection `vaani_kb`: each chunk stored with metadata
`{document_id, title, domain, source, language, chunk_index}` and its embedding.

---

## 4. REST API Design (all prefixed `/api`)

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/api/health` | liveness + subsystem status |
| POST | `/api/chat/stream` | SSE: RAG answer stream (text/event-stream) |
| POST | `/api/chat/message` | non-stream fallback |
| GET  | `/api/conversations` | list history |
| GET  | `/api/conversations/{id}` | messages of a conversation |
| DELETE | `/api/conversations/{id}` | delete |
| GET  | `/api/conversations/search?q=` | search across messages |
| POST | `/api/voice/transcribe` | multipart audio → text (Whisper) |
| POST | `/api/voice/speak` | text → audio (OpenAI TTS, base64/audio) |
| GET  | `/api/knowledge` | browse KB (filter domain, paginate) |
| GET  | `/api/knowledge/search?q=` | semantic search preview |
| GET  | `/api/knowledge/domains` | domain counts |
| POST | `/api/documents/upload` | ingest a PDF/txt → chunk+embed |
| GET  | `/api/documents` | list ingested docs |
| POST | `/api/documents/{id}/ask` | RAG constrained to one document |
| POST | `/api/bookmarks` / GET `/api/bookmarks` | manage bookmarks |
| GET  | `/api/system/status` | RAG/LLM/voice/vector health, mode, counts |
| GET  | `/api/hardware/capabilities` | active HAL adapter + capabilities |

SSE event shape:
```
event: meta   data: {"conversation_id","language","citations","confidence","retrieved":n}
event: token  data: {"delta":"..."}
event: done   data: {"message_id"}
event: error  data: {"message"}
```

---

## 5. RAG Pipeline (Trust-first)

```
user query ─▶ language detect ─▶ embed query ─▶ ChromaDB top-k (k=5, w/ score)
   │                                              │
   │                              ┌───────────────┘
   ▼                              ▼
 threshold gate         if max_score >= τ (0.30 cosine)  → GROUNDED path
   │                              │
   │                    build context from retrieved chunks (with [n] markers)
   │                              ▼
   │                    Gemini 3.1 Pro (system: answer ONLY from context, cite [n],
   │                    reply in user's language) → stream tokens
   │                              ▼
   │                    confidence = f(top score, score spread, coverage)
   │                    citations = retrieved chunks actually referenced
   ▼
 if below τ  → LOW-CONFIDENCE path: model states it lacks verified info,
               offers to connect / suggests nearest domain, confidence tagged low.
```

**Rule enforced:** when verified documents exist above threshold, the answer is generated
strictly from retrieved context (grounding prompt + citation requirement). Never free-form
from model memory when evidence exists. Every grounded answer carries citations + confidence.

Confidence score = weighted blend: `0.6*top_similarity + 0.25*coverage(#chunks used/k) + 0.15*margin(top-second)` clamped 0..1, surfaced as High (≥0.75) / Medium (0.5–0.75) / Low (<0.5).

---

## 6. Voice Pipeline

```
Mic (MediaRecorder webm/opus) ─▶ POST /voice/transcribe (multipart)
        └▶ Whisper-1 (language hint) ─▶ transcript ─▶ Chat RAG stream
Assistant final text ─▶ POST /voice/speak ─▶ OpenAI TTS ─▶ audio ─▶ <audio> playback
```
Frontend `useVoice` hook manages recording, waveform, and playback. Orb reflects state
(listening while recording, thinking during RAG, speaking during TTS playback).

---

## 7. Hardware Abstraction Layer (HAL)

Protocols in `hardware/interfaces.py`: `IMicrophone`, `ISpeaker`, `ICamera`, `IGPIO`,
`IDisplay`. Adapters: `laptop` (browser/OS default), `raspberry_pi` (arecord/aplay/GPIO),
`esp32` (serial/MQTT), `mock` (default in cloud). Selected by `VAANI_HARDWARE` env.
Business logic depends on interfaces only → swapping hardware never touches services.
`GET /api/hardware/capabilities` reports the active adapter + capability matrix.

---

## 8. React Component Hierarchy

```
App (Router, ThemeProvider, I18nProvider, ModeProvider)
├── Landing (/)                         [SHOWCASE MODE]
│   ├── CinematicIntro (R3F Canvas + GSAP timeline, 15–20s, skippable)
│   ├── LenisProvider
│   ├── ScrollStory (10 chapters, scroll-linked camera)
│   │   ├── OrbScene (Living Orb, particles, bloom)
│   │   └── Chapter x10 (India Awakens ... Live Dashboard)
│   └── EnterAppCTA
└── AppShell (/app/*)                    [DEVICE MODE]
    ├── SideDock / TopNav (glass, floating)
    ├── MiniOrb (persistent voice-state indicator)
    ├── Home  (quick actions, domains, recent)
    ├── Chat  (MessageList, Composer, VoiceButton, CitationCard, ConfidenceBadge, LangSwitch)
    ├── Knowledge (domain browser + semantic search)
    ├── Documents (upload, list, per-doc QA)
    ├── History (list + search + bookmarks)
    ├── Settings (theme, language, voice, mode, hardware)
    └── SystemStatus (subsystem health dashboard)
```

---

## 9. Backend Service Architecture
Routers (thin) → Services (business rules) → Repositories/Adapters (infra). Dependencies
injected via FastAPI `Depends` + a lightweight container in `core`. Services never import
FastAPI. All infra hidden behind Protocols (interfaces.py) for testability & swap-ability.

## 10. Sequence Diagram — Voice Chat (grounded)
```
User→FE: hold mic         FE: Orb=listening, MediaRecorder
FE→API: /voice/transcribe (audio)   API→Whisper: transcribe  →  transcript
FE→API: /chat/stream (transcript)   API→Chroma: retrieve k    Orb=thinking
API→Gemini: grounded prompt (SSE)   API→FE: meta(citations,confidence)+tokens
FE→API: /voice/speak(final)         API→TTS: audio   Orb=speaking → playback → idle
API→SQLite: persist user+assistant messages
```

## 11. Data Flow — Ingestion
`upload → detect type → extract text (pdf/txt) → chunk (≈800 tok, 120 overlap) → embed →
Chroma upsert (metadata) → documents row (chunk_count) → available to RAG`.

## 12. Authentication Flow
V1 is single-tenant kiosk/device model — **no login wall** (rural accessibility first). A
lightweight anonymous `device_id` (localStorage) namespaces conversations. Auth is an
optional future adapter (JWT) behind an `IAuth` seam; adding it will not change services.

## 13. Document Ingestion Pipeline — see §11. PDF via `pypdf`; OCR-ready seam (`IOcr`) for
scanned docs (future Tesseract adapter). Idempotent by content hash.

## 14. Vector Search Pipeline
ChromaDB embedded, default MiniLM ONNX embedding (offline, no network). Cosine space,
top-k with scores; threshold gate feeds RAG trust logic (§5).

## 15. Error Handling Strategy
`AppError` hierarchy (NotFound, Validation, Upstream, Unavailable) → global exception
handlers → consistent JSON `{error, code, detail}`. Upstream (LLM/voice) failures degrade
gracefully: streamed `error` event, friendly UI message, Orb=warning. Never leak stack traces.
Frontend ErrorBoundary per route + toast (sonner).

## 16. Offline Architecture
Vector store + SQLite are local → KB browse & retrieval work offline. LLM/voice need network;
UI shows Internet-status indicator, Orb=offline, cached conversations remain readable,
composer queues gracefully. Static assets cached; app shell loads without network.

## 17. Raspberry Pi Deployment (DEVICE MODE)
Env `VAANI_MODE=device` disables heavy shaders/bloom/particles on FE (same visual identity,
lower GPU); `VAANI_HARDWARE=raspberry_pi` selects arecord/aplay/GPIO adapters. Same codebase,
adapter + flag swap only. Docker `arm64` image.

## 18. Performance Optimization Plan
FE: route-level lazy loading, R3F only on landing, `prefers-reduced-motion` + device-mode
downgrade, memoized selectors, virtualized long lists, transition specific props only.
BE: async I/O throughout (aiosqlite), streaming responses (`X-Accel-Buffering: no`), Chroma
persistent client reused, embedding model loaded once at startup.

## 19. Security Architecture
Secrets only via `.env` (EMERGENT_LLM_KEY server-side, never shipped to FE). Input validation
at boundaries (Pydantic), file-type/size limits on upload (25MB), CORS from env, no eval,
parameterized SQL. LLM output rendered as sanitized markdown (no raw HTML injection).

## 20. UI Design System
Per `/app/design_guidelines.json`: fonts Cabinet Grotesk (headings) / Manrope (body) /
JetBrains Mono / Noto Sans Devanagari (scripts). Warm off-white `#FDFCF8` + deep forest
`#1A3626` (light); near-black `#0B0E0C` + pale sage (dark). Radii: cards rounded-3xl, buttons
pill. Generous spacing (2–3×). Glassmorphism 12–24px blur only where appropriate. 7 Orb color
states. No AI-slop, no emoji icons (lucide-react only).

## 21. Motion Design System
Framer Motion for UI (staggered fade-up entrances, page transitions, chat bubbles). GSAP +
Lenis for landing scroll-linked cinematic camera. Transitions on specific properties only.
Orb: breathing (idle), ripples (listening), swirl (thinking), audio-wave (speaking), burst
(success), pulse-edge (warning), dim-static (offline).

## 22. 3D Scene Architecture
R3F `<Canvas>` on landing only. Core objects: LivingOrb (MeshDistortMaterial + shader tint),
ParticleField (instanced points → neural-network lines), KnowledgeGalaxy, DocumentCards.
Post: Bloom + DepthOfField (showcase only). Scroll drives a single continuous camera rig
(no cuts). Device mode → static/simplified Orb, no post-processing.

## 23. State Management Architecture
React Query for server state (conversations, knowledge, status). Local React context for
Theme, Language (i18n), Mode (showcase/device), and Orb state. Voice/recording state in a
dedicated hook. No global redux — keep it lean.

## 24. Docker Architecture
`backend` (python:3.11-slim, uvicorn), `frontend` (node build → nginx), optional persistent
volume for `data/`. `docker-compose.yml` wires them; env-driven. arm64 build target for Pi.

## 25. Testing Strategy
BE: pytest unit (services with mocked LLM/vector) + integration (routers via httpx). RAG
grounding, confidence math, ingestion chunking, HAL selection covered. FE: component smoke +
the platform testing agent for end-to-end flows (voice, chat, citations, history, theme).

## 26. CI/CD Pipeline (ready)
Lint (flake8/eslint) → typecheck (mypy/tsc) → tests → build images. GitHub Actions workflow
skeleton included; deploy target env-agnostic.

## 27. Development Roadmap
- **M1 Foundation (this build):** config, domain, SQLite repos, Chroma store, HAL mock, health.
- **M2 RAG core:** ingest + seed real KB, retrieval, grounded Gemini, citations, confidence.
- **M3 Voice:** Whisper transcribe + TTS speak endpoints + hook.
- **M4 App UI:** Chat (stream/voice/citations/lang), Knowledge, Documents, History, Settings, Status.
- **M5 Cinematic landing:** intro + Living Orb + scroll story + Lenis/GSAP + bloom.
- **M6 Polish:** themes, offline indicator, skeletons, empty/error states, tests, docker.

Modules are built in this order; each integrates and runs before the next begins.
