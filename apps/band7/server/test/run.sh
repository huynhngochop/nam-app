#!/usr/bin/env bash
# Chạy migration + test trên Postgres local (không cần Supabase CLI)
set -euo pipefail
cd "$(dirname "$0")/.."
PSQL=(psql -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-postgres}" -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -c "drop database if exists band7_test" -c "create database band7_test"
"${PSQL[@]}" -d band7_test -f test/stub_supabase.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -d band7_test -f "$f"; done
"${PSQL[@]}" -d band7_test -f test/loop_test.sql
