-- Brief sürüm karşılaştırması için metin özeti ve fikir tekrarını önleme.
-- Not: lower() yerel ayara göre Türkçe İ/I harflerini çevirmez; önce translate ile eşlenir.
alter table product_briefs add column content_hash text;
create unique index product_briefs_hash on product_briefs (product_id, content_hash);

alter table ideas add column idea_key text generated always as (md5(lower(translate(regexp_replace(trim(idea), '\s+', ' ', 'g'), 'İIıÇŞĞÜÖÂ', 'iiiçşğüöâ')))) stored;
create unique index ideas_unique_per_product on ideas (product_id, idea_key);

-- Fikir araştırma notları (veri yetersizliği, elenen fikirler vb.) panelde gösterilir.
create table research_runs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  ran_at timestamptz not null default now(),
  trigger text not null check (trigger in ('weekly', 'emergency', 'manual')),
  added int not null,
  notes text[] not null default '{}'
);
alter table research_runs enable row level security;
create policy admin_read on research_runs for select to authenticated using (is_admin());
