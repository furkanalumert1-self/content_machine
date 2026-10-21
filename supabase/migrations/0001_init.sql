-- content_machine — ilk şema
-- Kurallar veritabanında da zorlanır: onaysız brief ile video yok, içerik değişince onay düşer,
-- PAUSED açıkken yayın kuyruğundan video çekilemez, aynı video iki kez "yayınlanıyor" durumuna alınamaz.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tipler
create type product_status as enum ('draft', 'active', 'paused');
create type brief_status   as enum ('draft', 'approved', 'superseded');
create type content_type   as enum ('problem_cozum', 'ipucu', 'mini_demo', 'once_sonra', 'mit_curutme');
create type video_status   as enum (
  'planned',        -- senaryo hazır, render bekliyor
  'rendering',
  'render_failed',  -- yayınlanamaz
  'ready',          -- render + kalite kontrol geçti, onay bekliyor
  'approved',
  'rejected',       -- yayınlanamaz
  'publishing',     -- publisher kilidi
  'published',
  'publish_failed'
);

-- ---------------------------------------------------------------- yetki
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email   text not null,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- ayarlar (tek satır)
create table app_settings (
  id int primary key default 1 check (id = 1),
  mode text not null default 'approval' check (mode in ('approval', 'auto')),
  paused boolean not null default false,
  daily_video_count int not null default 1 check (daily_video_count between 1 and 3),
  publish_windows jsonb not null default '[{"start":"12:00","end":"14:00"},{"start":"19:00","end":"22:00"}]',
  timezone text not null default 'Europe/Istanbul',
  multi_product_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into app_settings (id) values (1);

-- ---------------------------------------------------------------- ürünler ve brief'ler
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  site_url text,
  github_repo text check (github_repo is null or github_repo ~ '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'),
  vercel_project text,
  brand_colors jsonb not null default '{}',
  logo_url text,
  status product_status not null default 'draft',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table product_briefs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  version int not null,
  content_md text not null,
  sources jsonb not null default '[]',  -- senkronizasyonda okunan kaynaklar (URL, commit sha)
  status brief_status not null default 'draft',
  approved_at timestamptz,
  approved_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (product_id, version)
);
create unique index one_approved_brief_per_product on product_briefs (product_id) where status = 'approved';

-- Yeni brief onaylanınca eskisi "superseded" olur.
create or replace function brief_on_approve() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update product_briefs set status = 'superseded'
      where product_id = new.product_id and status = 'approved' and id <> new.id;
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end $$;
create trigger brief_on_approve before update on product_briefs
  for each row execute function brief_on_approve();

-- Ürün yalnızca onaylı brief'i varsa aktif olur; MVP'de tek aktif ürün.
create or replace function product_activation_guard() returns trigger language plpgsql as $$
begin
  if new.status = 'active' then
    if not exists (select 1 from product_briefs where product_id = new.id and status = 'approved') then
      raise exception 'Ürün aktif edilemez: onaylı brief yok (%).', new.slug;
    end if;
    if not (select multi_product_enabled from app_settings where id = 1)
       and exists (select 1 from products where status = 'active' and id <> new.id) then
      raise exception 'MVP modunda yalnızca bir ürün aktif olabilir.';
    end if;
  end if;
  return new;
end $$;
create trigger product_activation_guard before insert or update on products
  for each row execute function product_activation_guard();

-- ---------------------------------------------------------------- fikirler
create table ideas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  idea text not null,
  hook text not null,
  content_type content_type not null,
  source text not null check (source in ('changelog', 'audience', 'trend', 'performance', 'manual', 'deployment')),
  source_ref text,
  score int not null check (score between 0 and 100),
  is_exploration boolean not null default false,
  used boolean not null default false,
  last_used_at timestamptz,
  why text not null,
  created_at timestamptz not null default now()
);
create index ideas_pick on ideas (product_id, used, score desc);

-- ---------------------------------------------------------------- videolar
create table videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  brief_id uuid not null references product_briefs (id),
  idea_id uuid references ideas (id) on delete set null,
  origin text not null default 'auto' check (origin in ('auto', 'manual')),
  request_instruction text,
  style text not null,
  content_type content_type not null,
  duration_sec numeric(5,2) not null check (duration_sec between 15 and 45),
  script jsonb not null,          -- sahneler, ekran metinleri, altyazı
  caption text not null,
  hashtags text[] not null check (cardinality(hashtags) between 5 and 10),
  plan_reason text,               -- fikir/stil seçim gerekçesi
  status video_status not null default 'planned',
  render_attempts int not null default 0 check (render_attempts <= 3),
  storage_path text,
  file_size_bytes bigint,
  qc jsonb,                       -- otomatik kontrol sonuçları
  licenses jsonb not null default '[]',
  content_hash text not null default '',
  approved_hash text,
  approved_at timestamptz,
  publish_at timestamptz,
  publish_at_reason text,
  publish_started_at timestamptz,
  ig_container_id text,
  ig_media_id text unique,
  published_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_due on videos (status, publish_at);

create or replace function video_content_hash(v videos) returns text language sql immutable as $$
  select md5(coalesce(v.script::text, '') || '|' || coalesce(v.caption, '') || '|' ||
             coalesce(array_to_string(v.hashtags, ' '), '') || '|' || coalesce(v.storage_path, ''));
$$;

-- Video yalnızca ürünün onaylı brief'iyle oluşturulabilir.
create or replace function video_insert_guard() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from product_briefs
                 where id = new.brief_id and product_id = new.product_id and status = 'approved') then
    raise exception 'Video oluşturulamaz: brief onaylı değil veya ürüne ait değil.';
  end if;
  if new.status not in ('planned', 'rendering') then
    raise exception 'Yeni video % durumunda başlayamaz.', new.status;
  end if;
  new.content_hash := video_content_hash(new);
  new.approved_hash := null;
  return new;
end $$;
create trigger video_insert_guard before insert on videos
  for each row execute function video_insert_guard();

-- İçerik değişirse onay düşer; onay yalnızca "ready" durumundan verilir.
create or replace function video_update_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'published' and new.status <> 'published' then
    raise exception 'Yayınlanmış video geri alınamaz.';
  end if;
  new.content_hash := video_content_hash(new);
  new.updated_at := now();

  if new.content_hash <> old.content_hash and old.status in ('approved', 'ready', 'rejected') then
    new.approved_hash := null;
    new.approved_at := null;
    if new.status = 'approved' then
      new.status := 'ready';
    end if;
  end if;

  if new.status = 'approved' and old.status <> 'approved' then
    if old.status <> 'ready' then
      raise exception 'Yalnızca hazır (ready) video onaylanabilir; mevcut durum: %.', old.status;
    end if;
    new.approved_hash := new.content_hash;
    new.approved_at := now();
  end if;

  return new;
end $$;
create trigger video_update_guard before update on videos
  for each row execute function video_update_guard();

-- Publisher: zamanı gelmiş tek bir videoyu atomik olarak kilitler.
-- PAUSED açıksa hiçbir şey döndürmez. approval modunda yalnızca geçerli onaylı videolar seçilir.
create or replace function claim_due_video() returns setof videos
language plpgsql security definer set search_path = public as $$
declare s app_settings;
begin
  select * into s from app_settings where id = 1;
  if s.paused then return; end if;

  return query
  update videos v set status = 'publishing', publish_started_at = now()
  where v.id = (
    select c.id from videos c
    join products p on p.id = c.product_id and p.status = 'active'
    where c.publish_at <= now()
      and c.ig_media_id is null
      and c.storage_path is not null
      and (
        (c.status = 'approved' and c.approved_hash = c.content_hash)
        or (s.mode = 'auto' and c.status = 'ready')
      )
    order by c.publish_at
    limit 1
    for update of c skip locked
  )
  returning v.*;
end $$;
revoke all on function claim_due_video() from public, anon, authenticated;
grant execute on function claim_due_video() to service_role;

create table publish_attempts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text check (outcome in ('published', 'failed', 'skipped_paused', 'retry')),
  error_code text,
  error_message text
);

-- ---------------------------------------------------------------- metrikler (eksikler NULL kalır, uydurulmaz)
create table metrics (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos (id) on delete cascade,
  collected_at timestamptz not null default now(),
  hours_after_publish int not null,
  views bigint, reach bigint, likes bigint, saved bigint, shares bigint, comments bigint,
  avg_watch_time_ms bigint,
  raw jsonb not null default '{}'
);

-- ---------------------------------------------------------------- loglar (gizli değer yazılmaz; uygulamada maskelenir)
create table logs (
  id bigserial primary key,
  at timestamptz not null default now(),
  level text not null check (level in ('info', 'warn', 'error')),
  job text not null,
  message text not null,
  context jsonb not null default '{}'
);

-- ---------------------------------------------------------------- Instagram bağlantısı (token YALNIZCA service role)
create table instagram_connection (
  id int primary key default 1 check (id = 1),
  ig_user_id text not null,
  username text,
  access_token text not null,
  token_expires_at timestamptz not null,
  last_refreshed_at timestamptz,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now()
);

-- Panel için token içermeyen durum bilgisi.
create or replace function instagram_status()
returns table (connected boolean, username text, token_expires_at timestamptz, last_refreshed_at timestamptz, scopes text[])
language sql stable security definer set search_path = public as $$
  select true, c.username, c.token_expires_at, c.last_refreshed_at, c.scopes
  from instagram_connection c where is_admin()
  union all
  select false, null, null, null, null
  where is_admin() and not exists (select 1 from instagram_connection);
$$;

-- ---------------------------------------------------------------- RLS
alter table admins               enable row level security;
alter table app_settings         enable row level security;
alter table products             enable row level security;
alter table product_briefs       enable row level security;
alter table ideas                enable row level security;
alter table videos               enable row level security;
alter table publish_attempts     enable row level security;
alter table metrics              enable row level security;
alter table logs                 enable row level security;
alter table instagram_connection enable row level security;

create policy admin_self_read on admins for select to authenticated using (user_id = auth.uid());
create policy admin_all on app_settings     for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_all on products         for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_all on product_briefs   for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_all on ideas            for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_all on videos           for all to authenticated using (is_admin()) with check (is_admin());
create policy admin_read on publish_attempts for select to authenticated using (is_admin());
create policy admin_read on metrics          for select to authenticated using (is_admin());
create policy admin_read on logs             for select to authenticated using (is_admin());
-- instagram_connection: bilinçli olarak politika yok + yetki geri alınıyor.
revoke all on instagram_connection from anon, authenticated;
