#!/usr/bin/env bash
# Runs the RLS regression suite against the project's Supabase database.
# Requires SUPABASE_DB_URL in the environment (already set in the Lovable sandbox).
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL not set" >&2
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
psql "$SUPABASE_DB_URL" \
  --single-transaction \
  --set ON_ERROR_STOP=1 \
  -f "$DIR/tests/rls/credit-tables.sql"
