#!/usr/bin/env bash
# supabase/migrations/*.sql dosyalarını tek bir kurulum dosyasında birleştirir
# (Supabase SQL Editor'e tek seferde yapıştırmak için). Migration değişince yeniden çalıştırın.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$root/supabase/kurulum.sql}"
{
  echo "-- content_machine — Supabase tek seferlik kurulum (OTOMATİK ÜRETİLDİ, elle düzenlemeyin)"
  echo "-- Kaynak: supabase/migrations/*.sql · Üretmek için: bash scripts/build-supabase-setup.sh"
  echo "-- Tümü tek işlemde çalışır: bir hata olursa hiçbir değişiklik kalmaz."
  echo "begin;"
  for m in "$root"/supabase/migrations/*.sql; do
    echo; echo "-- ===== $(basename "$m") ====="; cat "$m"
  done
  echo; echo "commit;"
  echo "select 'KURULUM TAMAM' as sonuc;"
} > "$out"
echo "Yazıldı: $out"
