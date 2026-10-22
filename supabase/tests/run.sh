#!/usr/bin/env bash
# Şema testlerini geçici bir Postgres veritabanında çalıştırır.
# Yerelde: PG_BIN klasöründeki initdb/pg_ctl ile geçici küme açar.
# CI'da: DATABASE_URL verilirse doğrudan o veritabanını kullanır.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$here/../.."

# supabase/kurulum.sql, migration'larla birebir aynı olmalı.
expected="$(mktemp)"
bash "$root/scripts/build-supabase-setup.sh" "$expected" >/dev/null
cmp -s "$expected" "$root/supabase/kurulum.sql" || { rm -f "$expected"; echo "supabase/kurulum.sql güncel değil: bash scripts/build-supabase-setup.sh çalıştırıp commit edin"; exit 1; }
rm -f "$expected"

run_sql() {
  psql "$1" -q -v ON_ERROR_STOP=1 -f "$here/supabase_stub.sql"
  # Kullanıcının SQL Editor'e yapıştıracağı birleşik dosyanın aynısı test edilir.
  psql "$1" -q -v ON_ERROR_STOP=1 -f "$root/supabase/kurulum.sql" >/dev/null
  psql "$1" -q -v ON_ERROR_STOP=1 -f "$here/schema_test.sql"
  # psql bazı ayrıştırma hatalarında durmaz; son testin gerçekten çalıştığını doğrula.
  [[ "$(psql "$1" -tAc "select to_regclass('t.done') is not null")" == "t" ]] || { echo "TESTLER YARIDA KALDI"; exit 1; }
  echo "TÜM ŞEMA TESTLERİ GEÇTİ"
}

if [[ -n "${DATABASE_URL:-}" ]]; then
  run_sql "$DATABASE_URL"
  exit 0
fi

PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
tmp="$(mktemp -d)"
trap '"$PG_BIN/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT
"$PG_BIN/initdb" -D "$tmp/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"$PG_BIN/pg_ctl" -D "$tmp/data" -o "-k $tmp -c listen_addresses=''" -l "$tmp/log" start >/dev/null
createdb -h "$tmp" -U postgres cm_test
run_sql "postgresql://postgres@/cm_test?host=$tmp"
