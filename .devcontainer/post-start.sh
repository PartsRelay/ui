#!/usr/bin/env bash
set -euo pipefail

bun install --frozen-lockfile >/dev/null 2>&1 || bun install
