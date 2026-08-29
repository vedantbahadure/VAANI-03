# VAANI Competition Edition — Feature Checklist

Legend: ✅ done & verified · 🟡 done with caveat

## Priority 1
- ✅ **True offline mode** — service worker (`public/service-worker.js`) with network-first + cache
  fallback for app shell, knowledge, schemes, FAQs, conversations, docs, system status. Offline banner
  in app shell. Previously accessed content remains available with no internet.
- ✅ **Raspberry Pi Kiosk Mode** — `deploy/rpi/`: fullscreen Chromium (`--kiosk`, no chrome), auto-launch
  on boot (`vaani-kiosk.service` on `graphical.target`), watchdog restart loop, screen-blanking disabled,
  cursor hidden. Backend/frontend systemd units with `Restart=always` + memory caps for a 2 GB Pi.
- ✅ **Word-by-word speech highlighting** — `useSpeech` + word-indexed `RichText`; the spoken word is
  highlighted in real time during TTS playback in Chat and in Document Q&A.
- 🟡 **Wake-word “VAANI”** — `useWakeWord` (Web Speech API, `en-IN`, continuous). Toggle in Settings.
  Optimised to offload to the OS speech engine (light on Pi CPU). Caveat: Chromium’s Web Speech API
  typically needs connectivity; for fully-offline wake-word swap in a Vosk/Porcupine adapter (seam ready).
- ✅ **Animated listening orb + real-time mic waveform** — `Waveform` reads a live `AnalyserNode`;
  listening panel shows the breathing orb + reactive bars while recording.
- ✅ **One-touch Demo Mode** — `lib/demo.js` autopilot runs a scripted, multilingual showcase (EN → EN →
  HI → MR) with live progress and a Stop control.

## Priority 2
- ✅ **“Am I Eligible?” assistant** — `EligibilityWizard` (guided steps: scheme, land, category, taxpayer,
  govt employee) → builds a grounded RAG query. Entry from Home.
- ✅ **Voice-guided document reading** — read-aloud with synchronized highlight in the Document Q&A modal.
- ✅ **Interactive multilingual translation** — per-message Translate button + `POST /api/translate`
  (Gemini). Cross-lingual retrieval already translates non-English queries before search.
- ✅ **Smart quick actions** — context-aware follow-up chips derived from the answer’s citation domain.
- ✅ **Voice interruption (barge-in)** — starting mic / sending / wake-word stops current TTS immediately.

## Priority 3 (polish)
- ✅ Subtle WebAudio sound effects (send/receive/listen/success), toggle in Settings.
- ✅ Smoother transitions (property-specific), staggered entrances, animated orb states.
- ✅ Premium loading states (Suspense orb loader, skeletons, streaming indicators).
- ✅ Polished typography (Cabinet Grotesk / Manrope / Noto Sans Devanagari) + responsive layouts.
- ✅ Device mode (showcase↔device) disables heavy 3D/bloom for Pi while keeping the visual identity.

## Deployment / Quality
- ✅ Production build verified (2.1 MB; 3D bundle lazy-loaded on landing only).
- ✅ Backend 21/21 pytest passing; core RAG/voice/knowledge/docs curl-verified.
- ✅ Docker (backend/frontend/compose) + full SDD (`docs/SDD.md`).
