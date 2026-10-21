-- Metrik kontrol noktaları (yayından 24 ve 72 saat sonra) ve takipçi aktif saatleri.
alter table metrics add column checkpoint smallint check (checkpoint in (24, 72));
alter table metrics add column total_interactions bigint;
alter table metrics add column avg_watch_time_raw numeric; -- birimi Meta belgesinde belirtilmiyor; ham değer
alter table metrics drop column avg_watch_time_ms;
create unique index metrics_one_per_checkpoint on metrics (video_id, checkpoint);

-- online_followers: İstanbul saatine çevrilmiş saat başına çevrimiçi takipçi (son 30 gün; ≥100 takipçi gerekir).
create table audience_activity (
  day date not null,
  hour_local smallint not null check (hour_local between 0 and 23),
  followers_online bigint not null,
  collected_at timestamptz not null default now(),
  primary key (day, hour_local)
);
alter table audience_activity enable row level security;
create policy admin_read on audience_activity for select to authenticated using (is_admin());
