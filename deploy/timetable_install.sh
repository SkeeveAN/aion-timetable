#!/usr/bin/env bash
# Zieht den aktuellen main-Branch nach /opt/timetable, installiert die
# Backend-Abhängigkeiten, wendet ausstehende DB-Migrationen an und
# startet den systemd-Service (neu). Beliebig oft wiederholbar - jeder
# Schritt ist idempotent.
#
# Wird auf dem Server als `timetable_install` über einen Symlink nach
# /usr/local/bin bereitgestellt (siehe README/deploy-Doku). Muss als root
# laufen: es schreibt die systemd-Unit und steuert den Service, alle
# anderen Schritte laufen unter dem unprivilegierten Service-User.
set -euo pipefail

REPO_DIR="/opt/timetable"
REPO_URL="https://github.com/SkeeveAN/aion-timetable.git"
SERVICE_NAME="aion-timetable-backend"
SERVICE_USER="aion-timetable"

if [[ "$EUID" -ne 0 ]]; then
  echo "timetable_install muss als root laufen (braucht systemctl + die Service-Unit-Datei)." >&2
  exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "==> Noch kein Git-Checkout unter $REPO_DIR gefunden, klone frisch..."
  su - "$SERVICE_USER" -s /bin/bash -c "git clone --branch main '$REPO_URL' '$REPO_DIR'"
fi

echo "==> Hole aktuellen Code..."
su - "$SERVICE_USER" -s /bin/bash -c "
  set -e
  cd '$REPO_DIR'
  git fetch origin
  git reset --hard origin/main
"

echo "==> Installiere Backend-Abhängigkeiten..."
su - "$SERVICE_USER" -s /bin/bash -c "
  set -e
  cd '$REPO_DIR'
  export PLAYWRIGHT_BROWSERS_PATH='$REPO_DIR/apps/backend/.playwright-browsers'
  corepack enable >/dev/null 2>&1 || true
  pnpm install --filter='backend...'
  cd apps/backend
  pnpm exec playwright install chromium
  pnpm run db:migrate
  pnpm run db:seed
"

echo "==> Installiere/aktualisiere systemd-Unit..."
cp "$REPO_DIR/deploy/aion-timetable-backend.service" "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null

echo "==> Starte Service neu..."
systemctl restart "$SERVICE_NAME"
sleep 2
systemctl status "$SERVICE_NAME" --no-pager -l | head -12

echo "==> Fertig."
