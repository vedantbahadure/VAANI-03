#!/usr/bin/env bash
# One-shot provisioning for VAANI on Raspberry Pi 4 (Raspberry Pi OS 64-bit, Bookworm).
set -euo pipefail
ROOT="/home/pi/vaani"

echo "==> Installing system packages"
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip chromium-browser unclutter x11-xserver-utils nodejs npm
sudo npm i -g serve

echo "==> Backend venv + deps"
python3 -m venv "$ROOT/venv"
"$ROOT/venv/bin/pip" install --upgrade pip
"$ROOT/venv/bin/pip" install -r "$ROOT/backend/requirements.txt"
"$ROOT/venv/bin/pip" install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

echo "==> Frontend production build (device mode is chosen at runtime in Settings)"
cd "$ROOT/frontend" && npm ci && npm run build

echo "==> Installing systemd services"
sudo cp "$ROOT/deploy/rpi/vaani-backend.service" /etc/systemd/system/
sudo cp "$ROOT/deploy/rpi/vaani-frontend.service" /etc/systemd/system/
sudo cp "$ROOT/deploy/rpi/vaani-kiosk.service" /etc/systemd/system/
chmod +x "$ROOT/deploy/rpi/start-kiosk.sh"
sudo systemctl daemon-reload
sudo systemctl enable vaani-backend vaani-frontend vaani-kiosk
sudo systemctl start vaani-backend vaani-frontend vaani-kiosk

echo "==> Done. VAANI will auto-launch fullscreen on boot."
