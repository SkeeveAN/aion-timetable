#!/usr/bin/env bash
# Installiert die Backend-Abhängigkeiten, wendet ausstehende DB-Migrationen an
# und startet den systemd-Service (neu). Beliebig oft wiederholbar - jeder
# Schritt ist idempotent.
#
# Wird ausschließlich vom Bootstrap-Skript `timetable_install` aufgerufen,
# NACHDEM der Git-Checkout bereits aktualisiert wurde - dieses Skript rührt
# absichtlich nicht selbst an git, damit es sich nicht während der eigenen
# Ausführung unter sich selbst verändert.
set -euo pipefail

REPO_DIR="/opt/timetable"
SERVICE_NAME="aion-timetable-backend"
SERVICE_USER="aion-timetable"

if [[ "$EUID" -ne 0 ]]; then
  echo "install-backend.sh muss als root laufen (braucht systemctl + die Service-Unit-Datei)." >&2
  exit 1
fi

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
