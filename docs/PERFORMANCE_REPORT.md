# VAANI — Performance Report

Measured in the development container (x86_64). Raspberry Pi 4 (2 GB) figures are conservative
estimates based on the workload profile; the app is designed to stay comfortably within 2 GB.

## Backend (FastAPI + ChromaDB + SQLite)
| Metric | Value |
|--------|-------|
| Health endpoint latency | ~0.15 s |
| Resident memory (main process) | ~132 MB (chromadb + onnxruntime + app) |
| Data footprint (12-doc KB) | 764 KB total (Chroma 680 KB, SQLite 80 KB) |
| Cold start (import + KB seed) | KB seeds once in a background task; API serves immediately |
| RAG retrieval (top-k, k=5) | few ms (embedded, local) |
| Streamed answer | tokens stream live (SSE, buffering disabled) |

The embedding model (MiniLM ONNX) loads once at first use and is cached locally → offline-friendly.

## Frontend (production build)
| Chunk | Size (uncompressed) | When loaded |
|-------|--------------------:|-------------|
| Total `build/` | 2.1 MB | — |
| Three.js / R3F chunk (`655…`) | ~1.0 MB | **Landing route only** (lazy) |
| `main.js` | ~305 KB | App shell |
| Other route chunks | 1–51 KB each | Per-route lazy |

Key point for Raspberry Pi: the kiosk starts at `/app`, so the heavy 3D bundle is **never fetched**
in Device Mode. Route-level code splitting keeps each app screen small.

## Optimisations applied
- Route-level lazy loading (landing + every app screen).
- 3D confined to the landing route; **Device Mode** disables bloom/post-processing/particles.
- `GENERATE_SOURCEMAP=false` for a lean production build.
- Service worker caches shell + API GETs (offline + faster repeat loads).
- Async I/O throughout backend; embedding model loaded once; SSE with `X-Accel-Buffering: no`.
- Systemd `MemoryMax` caps on the Pi (backend 900 MB, frontend 250 MB).
- `prefers-reduced-motion` honoured; particle density scales with viewport and mode.

## Responsiveness
- Chat streams token-by-token; orb reflects state (idle/listening/thinking/speaking/success).
- Waveform + highlight run on `requestAnimationFrame` (no layout thrash).

## Recommendations for the Pi 4 (2 GB)
- Run in **Device Mode** (Settings) for the kiosk.
- Use the provided systemd units (auto-restart + memory caps).
- Keep `VAANI_MODE=device`, `VAANI_HARDWARE=raspberry_pi`.
- Pre-warm the KB once online so embeddings + caches are populated for offline use.
