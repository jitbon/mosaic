#!/usr/bin/env bash
# dev.sh — Start backend + web frontend, then open browser
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
WEB="$ROOT/web"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[dev]${NC} $*"; }
warn() { echo -e "${YELLOW}[dev]${NC} $*"; }
die()  { echo -e "${RED}[dev] ERROR:${NC} $*" >&2; exit 1; }

# Cleanup on exit — kill both servers
PIDS=()
cleanup() {
  if [ ${#PIDS[@]} -gt 0 ]; then
    log "Shutting down..."
    kill "${PIDS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ── Backend ──────────────────────────────────────────────────────────────────

# Source backend/.env so OS env vars don't override with stale/empty values
if [ -f "$BACKEND/.env" ]; then
  set -a
  source "$BACKEND/.env"
  set +a
fi

log "Setting up backend..."

# Ensure venv exists and python works
if [ ! -f "$BACKEND/venv/bin/python3" ]; then
  warn "venv missing or broken — recreating..."
  rm -rf "$BACKEND/venv"
  python3 -m venv "$BACKEND/venv"
fi

# Ensure .env exists
if [ ! -f "$BACKEND/.env" ]; then
  if [ -f "$BACKEND/.env.example" ]; then
    warn ".env not found — copying from .env.example (fill in secrets before use)"
    cp "$BACKEND/.env.example" "$BACKEND/.env"
  else
    die ".env missing and no .env.example to copy from"
  fi
fi

log "Installing/verifying backend dependencies..."
"$BACKEND/venv/bin/pip" install -r "$BACKEND/requirements.txt" -q

log "Starting backend on http://localhost:8000 ..."
cd "$BACKEND"
"$BACKEND/venv/bin/uvicorn" src.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)

# ── Web ───────────────────────────────────────────────────────────────────────

log "Setting up web frontend..."

if [ ! -d "$WEB/node_modules" ]; then
  log "Installing web dependencies..."
  cd "$WEB" && npm install
fi

log "Starting web frontend on http://localhost:3000 ..."
cd "$WEB"
npm run dev &
WEB_PID=$!
PIDS+=($WEB_PID)

# ── Wait for servers, then open browser ──────────────────────────────────────

log "Waiting for servers to be ready..."

wait_for_port() {
  local port=$1 name=$2 path=${3:-/} timeout=30 elapsed=0
  while ! curl -sf "http://localhost:$port$path" >/dev/null 2>&1; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ $elapsed -ge $timeout ]; then
      warn "$name did not respond on port $port within ${timeout}s — opening browser anyway"
      return 1
    fi
  done
  log "$name ready"
}

wait_for_port 8000 "Backend" /health
wait_for_port 3000 "Web frontend" /

log "Opening http://localhost:3000 in browser..."
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:3000" 2>/dev/null &
elif command -v open >/dev/null 2>&1; then
  open "http://localhost:3000" &
else
  warn "Could not detect a browser opener — visit http://localhost:3000 manually"
fi

log "Both servers running. Press Ctrl+C to stop."
wait
