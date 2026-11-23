#!/usr/bin/env bash
set -euo pipefail

SPEC_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "[AI-Specs pre-commit] Running unified quality gate..."
python3 "$SPEC_ROOT/scripts/check-all.py" "$SPEC_ROOT"
