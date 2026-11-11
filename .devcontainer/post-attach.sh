#!/usr/bin/env bash
set -euo pipefail

if (exec 3<>/dev/tcp/127.0.0.1/5173) 2>/dev/null; then
  echo "ui is already running on http://localhost:${UI_PORT:-5173}, stop it with: pkill -f 'vite.js dev'"
else
  exec bun run dev
fi
