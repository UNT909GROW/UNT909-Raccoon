#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

function usage() {
  echo "Usage: $0 [up|down|seed|demo]"
  exit 1
}

if [ "${1-}" = "" ]; then
  usage
fi

cmd="$1"

case "$cmd" in
  up)
    echo "[unit09-local-demo] Starting docker compose stack..."
    cd "$ROOT_DIR"
    docker compose up -d
    ;;
  down)
    echo "[unit09-local-demo] Stopping docker compose stack..."
    cd "$ROOT_DIR"
    docker compose down -v
    ;;
  seed)
    echo "[unit09-local-demo] Seeding demo data via seed_demo_data.ts..."
    cd "$ROOT_DIR"
    npx ts-node scripts/seed_demo_data.ts
    ;;
  demo)
    echo "[unit09-local-demo] Running demo workflow..."
    cd "$ROOT_DIR"
    npx ts-node scripts/demo_workflow.ts
    ;;
  *)
    usage
    ;;
esac
