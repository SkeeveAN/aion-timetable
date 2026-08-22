#!/usr/bin/env bash
# Pulls the latest main branch into /opt/timetable, installs backend
# dependencies, applies pending DB migrations, and (re)starts the systemd
# service. Safe to re-run any time - every step is idempotent.
#
# Installed as `timetable_install` on the server via a symlink into
# /usr/local/bin (see README/deploy docs). Must run as root: it needs to
# write the systemd unit and control the service, and drops to the
# unprivileged service user for everything else.
set -euo pipefail

REPO_DIR="/opt/timetable"
REPO_URL="https://github.com/SkeeveAN/aion-timetable.git"
SERVICE_NAME="aion-timetable-backend"
SERVICE_USER="aion-timetable"

if [[ "$EUID" -ne 0 ]]; then
  echo "timetable_install must be run as root (needs systemctl + the service unit file)." >&2
  exit 1
fi

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "==> No git checkout found at $REPO_DIR yet, cloning..."
  su - "$SERVICE_USER" -s /bin/bash -c "git clone --branch main '$REPO_URL' '$REPO_DIR'"
fi

echo "==> Fetching latest code..."
su - "$SERVICE_USER" -s /bin/bash -c "
  set -e
  cd '$REPO_DIR'
  git fetch origin
  git reset --hard origin/main
"

echo "==> Installing backend dependencies..."
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

echo "==> Installing/updating systemd unit..."
cp "$REPO_DIR/deploy/aion-timetable-backend.service" "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null

echo "==> Restarting service..."
systemctl restart "$SERVICE_NAME"
sleep 2
systemctl status "$SERVICE_NAME" --no-pager -l | head -12

echo "==> Done."
