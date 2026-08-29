#!/usr/bin/env bash
# VAANI Kiosk launcher for Raspberry Pi 4 (Chromium fullscreen, no chrome, watchdog).
set -euo pipefail

URL="${VAANI_URL:-http://localhost:3000/app}"
export DISPLAY="${DISPLAY:-:0}"

# Hide cursor + disable screen blanking
command -v unclutter >/dev/null && unclutter -idle 0.5 -root &
xset s off || true
xset -dpms || true
xset s noblank || true

# Pick chromium binary
CHROME="$(command -v chromium-browser || command -v chromium || echo chromium-browser)"

FLAGS=(
  --kiosk
  --incognito
  --noerrdialogs
  --disable-infobars
  --disable-session-crashed-bubble
  --disable-features=TranslateUI
  --check-for-update-interval=31536000
  --overscroll-history-navigation=0
  --autoplay-policy=no-user-gesture-required
  --use-gl=egl
  --enable-features=OverlayScrollbar
  --app="$URL"
)

# Watchdog: relaunch if Chromium exits/crashes
while true; do
  "$CHROME" "${FLAGS[@]}" || true
  echo "[vaani-kiosk] Chromium exited, restarting in 3s..."
  sleep 3
done
