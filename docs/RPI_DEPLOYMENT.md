# VAANI — Raspberry Pi 4 (2 GB) Deployment Guide

Target: Raspberry Pi 4 Model B (2 GB), Raspberry Pi OS 64-bit (Bookworm), desktop/X11 session.
Result: VAANI auto-launches fullscreen on boot as a touch kiosk, with backend + frontend running
as auto-restarting services.

## 1. Copy the project
```bash
sudo mkdir -p /home/pi/vaani && sudo chown pi:pi /home/pi/vaani
# copy the repo (backend/, frontend/, deploy/) into /home/pi/vaani
```

## 2. Configure secrets
Create `/home/pi/vaani/backend/.env`:
```
EMERGENT_LLM_KEY=sk-...            # your key
MONGO_URL=mongodb://localhost:27017
DB_NAME=vaani
CORS_ORIGINS=*
VAANI_MODE=device
VAANI_HARDWARE=raspberry_pi
```
Set `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 3. One-shot provisioning
```bash
bash /home/pi/vaani/deploy/rpi/provision.sh
```
This installs packages (Chromium, unclutter, node, serve, python venv), installs backend +
frontend deps, builds the frontend, and installs + enables the three systemd services:
`vaani-backend`, `vaani-frontend`, `vaani-kiosk`.

## 4. Reboot
```bash
sudo reboot
```
On boot VAANI opens fullscreen at `/app` in Device Mode. The kiosk watchdog restarts Chromium if it
ever exits; systemd restarts the backend/frontend on failure.

## Services
| Service | Purpose | Restart | Memory cap |
|---------|---------|---------|-----------|
| `vaani-backend.service` | FastAPI (uvicorn :8001) | always | 900 MB |
| `vaani-frontend.service` | static build via `serve` :3000 | always | 250 MB |
| `vaani-kiosk.service` | Chromium `--kiosk` + watchdog | always | — |

Useful commands:
```bash
sudo systemctl status vaani-backend vaani-frontend vaani-kiosk
sudo journalctl -u vaani-kiosk -f
sudo systemctl restart vaani-kiosk
```

## Touchscreen & performance tips
- Set VAANI to **Device Mode** (Settings) — disables bloom/particles, keeps the same identity.
- The 3D landing bundle is never loaded at `/app`, so RAM/CPU stay low.
- For a rotated DSI display, add `display_rotate` / `dtoverlay` in `/boot/config.txt`.
- Disable Wi-Fi power management for stable connectivity: `sudo iw dev wlan0 set power_save off`.

## Audio (mic + speaker) on the Pi
- USB mic + 3.5 mm / HDMI speaker work out of the box with ALSA.
- The Hardware Abstraction Layer reports the active adapter at `GET /api/hardware/capabilities`
  (`raspberry_pi` → arecord/aplay/GPIO drivers). Business logic is unchanged across hardware.

## Offline behaviour
- After first online use, the service worker caches the shell + accessed schemes/FAQs/conversations.
- With no internet: browse cached knowledge and past conversations; new LLM answers require
  connectivity (a clear banner is shown). Wake-word (Web Speech) also needs connectivity on Chromium.
