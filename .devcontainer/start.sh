#!/usr/bin/env bash
set -euo pipefail
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi
python -m uvicorn kernel_service:app --host 127.0.0.1 --port 8765 &
KERNEL_PID=$!
trap 'kill "$KERNEL_PID" 2>/dev/null || true' EXIT
npm run build
npm start
