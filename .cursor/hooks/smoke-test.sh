#!/usr/bin/env bash
set -euo pipefail

# Cursor stop hook: run smoke tests when an agent session ends.
cat >/dev/null

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! command -v npm >/dev/null 2>&1; then
  echo '{"followup_message":"npm was not found in PATH, so smoke tests could not run."}'
  exit 0
fi

if npm run test:smoke >/tmp/live-vi-smoke.log 2>&1; then
  exit 0
fi

echo '{"followup_message":"Smoke tests failed after this agent session. Run npm run test:smoke, fix failures, and re-run until all tests pass."}'
exit 0
