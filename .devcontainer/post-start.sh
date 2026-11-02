#!/usr/bin/env bash
set -euo pipefail

bun install --frozen-lockfile >/dev/null 2>&1 || bun install

if ! pgrep -f 'bun run dev' >/dev/null; then
  nohup setsid bun run dev >/tmp/ui-dev.log 2>&1 &
fi

for _ in $(seq 1 60); do
  if (exec 3<>/dev/tcp/127.0.0.1/5173) 2>/dev/null; then
    echo "ui is running on http://localhost:${UI_PORT:-5173}, log: tail -f /tmp/ui-dev.log"
    exit 0
  fi
  sleep 1
done

echo 'ui did not start within 60 seconds, last lines of /tmp/ui-dev.log:' >&2
tail -n 30 /tmp/ui-dev.log >&2
exit 1
