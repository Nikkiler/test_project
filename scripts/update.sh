#!/bin/bash
# ─── Auto-update script ──────────────────────────────────────────────────────
# Checks GitHub for new commits. If found, pulls changes, rebuilds, and restarts.
#
# Usage:
#   ./scripts/update.sh          — run once manually
#   crontab: */5 * * * *         — run every 5 minutes automatically
# ─────────────────────────────────────────────────────────────────────────────

# cd to the project root (wherever this script lives)
cd "$(dirname "$0")/.." || exit 1

LOG="logs/update.log"
mkdir -p logs

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# Fetch latest from origin without changing anything yet
git fetch origin main --quiet 2>> "$LOG"

# Compare local HEAD with remote HEAD
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  # No changes — nothing to do
  exit 0
fi

log "New commits detected: $LOCAL -> $REMOTE"
log "Pulling changes..."

# Pull the latest code
git pull origin main --quiet 2>> "$LOG"

if [ $? -ne 0 ]; then
  log "ERROR: git pull failed"
  exit 1
fi

log "Installing dependencies..."
npm install --quiet 2>> "$LOG"

log "Rebuilding..."
npm run build 2>> "$LOG"

if [ $? -ne 0 ]; then
  log "ERROR: build failed"
  exit 1
fi

log "Restarting app..."
pm2 restart chat 2>> "$LOG" || npm start &

log "Update complete. Now running $(git rev-parse --short HEAD)"
