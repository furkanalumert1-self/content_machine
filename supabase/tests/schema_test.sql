-- Şema kurallarının testleri. Çalıştırma: supabase/tests/run.sh
\set ON_ERROR_STOP 1
set client_min_messages = warning;
\o /dev/null

create schema t;
grant usage on schema t to anon, authenticated, service_role;
create function t.expect_error(q text, pattern text) returns void language plpgsql as $$
begin
  begin
    execute q;
  exception when others then
    if sqlerrm !~* pattern then
      raise exception 'Beklenen hata "%" değil, gelen: %', pattern, sqlerrm;
    end if;
    return;
  end;
  raise exception 'Hata bekleniyordu ama sorgu başarılı oldu: %', q;
end $$;
grant execute on function t.expect_error(text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------- hazırlık
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'sahip@example.com'),
                              ('00000000-0000-0000-0000-00000000000b', 'yabanci@example.com');
insert into admins values ('00000000-0000-0000-0000-00000000000a', 'sahip@example.com');
insert into products (id, slug, name) values ('10000000-0000-0000-0000-000000000001', 'callypso-engage', 'Callypso Engage'),
                                             ('10000000-0000-0000-0000-000000000002', 'inboxly', 'Inboxly');
insert into product_briefs (id, product_id, version, content_md)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, '# taslak'),
         ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 1, '# taslak');

\echo 'T1 onaysız brief ile ürün aktif edilemez'
select t.expect_error($$update products set status='active' where slug='callypso-engage'$$, 'onaylı brief yok');

\echo 'T2 brief onaylanınca ürün aktif olur; yeni sürüm onaylanınca eskisi superseded'
update product_briefs set status='approved' where id='20000000-0000-0000-0000-000000000001';
update products set status='active' where slug='callypso-engage';
insert into product_briefs (id, product_id, version, content_md, status)
  values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2, '# v2', 'draft');
update product_briefs set status='approved' where id='20000000-0000-0000-0000-000000000003';
do $$ begin
  assert (select status from product_briefs where id='20000000-0000-0000-0000-000000000001') = 'superseded';
end $$;

\echo 'T3 MVP modunda ikinci ürün aktif edilemez'
update product_briefs set status='approved' where id='20000000-0000-0000-0000-000000000002';
select t.expect_error($$update products set status='active' where slug='inboxly'$$, 'yalnızca bir ürün');

\echo 'T4 onaysız/eski brief ile video oluşturulamaz'
select t.expect_error($$insert into videos (product_id, brief_id, style, content_type, duration_sec, script, caption, hashtags)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'dark-keynote', 'ipucu', 30, '{}', 'c',
          array['#a','#b','#c','#d','#e'])$$, 'brief onaylı değil');
select t.expect_error($$insert into videos (product_id, brief_id, style, content_type, duration_sec, script, caption, hashtags)
  values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'dark-keynote', 'ipucu', 30, '{}', 'c',
          array['#a','#b','#c','#d','#e'])$$, 'brief onaylı değil');

insert into videos (id, product_id, brief_id, style, content_type, duration_sec, script, caption, hashtags)
values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
        'dark-keynote', 'problem_cozum', 30, '{"scenes":[1]}', 'ilk caption', array['#a','#b','#c','#d','#e']);

\echo 'T5 onay kuralları'
select t.expect_error($$update videos set status='approved' where id='30000000-0000-0000-0000-000000000001'$$, 'Yalnızca hazır');
update videos set status='ready', storage_path='v/1.mp4' where id='30000000-0000-0000-0000-000000000001';
update videos set status='approved' where id='30000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select approved_hash = content_hash from videos where id='30000000-0000-0000-0000-000000000001');
end $$;
-- Saat değişikliği onayı bozmaz
update videos set publish_at = now() + interval '1 hour', publish_at_reason='test' where id='30000000-0000-0000-0000-000000000001';
do $$ begin assert (select status from videos where id='30000000-0000-0000-0000-000000000001') = 'approved'; end $$;
-- İçerik değişince onay düşer
update videos set caption='değişti' where id='30000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select status = 'ready' and approved_hash is null from videos where id='30000000-0000-0000-0000-000000000001');
end $$;
-- Onaylı iken durumla birlikte içerik değişse bile onay düşer
update videos set status='approved' where id='30000000-0000-0000-0000-000000000001';
update videos set status='approved', hashtags=array['#x','#b','#c','#d','#e'] where id='30000000-0000-0000-0000-000000000001';
do $$ begin assert (select status from videos where id='30000000-0000-0000-0000-000000000001') = 'ready'; end $$;
update videos set status='approved' where id='30000000-0000-0000-0000-000000000001';

\echo 'T6 publisher kilidi: PAUSED, zaman ve mükerrer koruma'
update app_settings set paused = true;
do $$ begin assert (select count(*) from claim_due_video()) = 0; end $$;
update app_settings set paused = false;
do $$ begin assert (select count(*) from claim_due_video()) = 0, 'zamanı gelmemiş video seçildi'; end $$;
update videos set publish_at = now() - interval '1 minute' where id='30000000-0000-0000-0000-000000000001';
do $$ begin assert (select count(*) from claim_due_video()) = 1; end $$;
do $$ begin assert (select count(*) from claim_due_video()) = 0, 'aynı video ikinci kez kilitlendi'; end $$;

\echo 'T7 reddedilen / başarısız / onaysız videolar yayına alınmaz (auto modda bile reddedilen alınmaz)'
insert into videos (id, product_id, brief_id, style, content_type, duration_sec, script, caption, hashtags, publish_at)
select ('30000000-0000-0000-0000-00000000000' || n)::uuid, '10000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000003', 'dark-keynote', 'ipucu', 20, jsonb_build_object('n', n), 'c' || n,
       array['#a','#b','#c','#d','#e'], now() - interval '1 hour'
from generate_series(2, 4) n;
update videos set status='ready', storage_path='v/x.mp4' where id in ('30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003');
update videos set status='rejected' where id='30000000-0000-0000-0000-000000000002';
update videos set status='render_failed' where id='30000000-0000-0000-0000-000000000004';
do $$ begin assert (select count(*) from claim_due_video()) = 0, 'approval modunda onaysız video seçildi'; end $$;
-- Test kurulumu: 7 gün kilidini (T15'te test edilir) atlamak için tetikleyiciler geçici kapatılır.
set session_replication_role = replica;
update app_settings set mode = 'auto';
set session_replication_role = origin;
do $$ declare r videos; begin
  select * into r from claim_due_video();
  assert r.id = '30000000-0000-0000-0000-000000000003', 'auto modda hazır video seçilmeli';
  assert (select count(*) from claim_due_video()) = 0, 'reddedilen/başarısız video seçildi';
end $$;
update app_settings set mode = 'approval';

\echo 'T8 yayınlanmış video geri alınamaz; ig_media_id tekil'
update videos set status='published', ig_media_id='IG1', published_at=now() where id='30000000-0000-0000-0000-000000000001';
select t.expect_error($$update videos set status='approved' where id='30000000-0000-0000-0000-000000000001'$$, 'geri alınamaz');
select t.expect_error($$update videos set ig_media_id='IG1' where id='30000000-0000-0000-0000-000000000003'$$, 'duplicate key');

insert into instagram_connection (ig_user_id, username, access_token, token_expires_at)
values ('123', 'callypso', 'GIZLI-TOKEN', now() + interval '60 days');

\echo 'T9 RLS: anonim kullanıcı hiçbir veri göremez'
set role anon;
do $$ begin
  assert (select count(*) from products) = 0;
  assert (select count(*) from videos) = 0;
  assert (select count(*) from instagram_status()) = 0;
end $$;
select t.expect_error('select * from instagram_connection', 'permission denied');
select t.expect_error('select * from claim_due_video()', 'permission denied');
select t.expect_error($$insert into products (slug, name) values ('x', 'x')$$, 'row-level security');
reset role;

\echo 'T10 RLS: giriş yapmış ama yönetici olmayan kullanıcı veri göremez'
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from products) = 0;
  assert (select count(*) from app_settings) = 0;
  assert (select count(*) from logs) = 0;
end $$;
update app_settings set paused = true;  -- RLS: hata vermez, 0 satır günceller
reset role;
do $$ begin assert not (select paused from app_settings), 'yabancı kullanıcı ayarı değiştirdi'; end $$;

\echo 'T11 RLS: yönetici verileri görür ama tokeni göremez'
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from products) = 2;
  assert (select connected and username = 'callypso' from instagram_status());
end $$;
select t.expect_error('select access_token from instagram_connection', 'permission denied');
select t.expect_error('select * from claim_due_video()', 'permission denied');
update app_settings set paused = true;
reset role;
do $$ begin assert (select paused from app_settings); end $$;
\echo 'T12 aynı fikir (büyük/küçük harf ve boşluk farkıyla) iki kez eklenemez'
insert into ideas (product_id, idea, hook, content_type, source, score, why)
values ('10000000-0000-0000-0000-000000000001', 'İpucu:  ilk kez alanları ayır', 'h', 'ipucu', 'audience', 70, 'w');
select t.expect_error($$insert into ideas (product_id, idea, hook, content_type, source, score, why)
  values ('10000000-0000-0000-0000-000000000001', 'ipucu: ilk kez alanları ayır', 'h', 'ipucu', 'audience', 70, 'w')$$, 'duplicate key');
select t.expect_error($$insert into ideas (product_id, idea, hook, content_type, source, score, why)
  values ('10000000-0000-0000-0000-000000000001', 'x', 'h', 'ipucu', 'audience', 101, 'w')$$, 'check constraint');

\echo 'T13 yayın sırasında içerik değişmez; geçici hatada onay korunarak kuyruğa döner'
update app_settings set paused = false;  -- T11 PAUSED'ı açık bıraktı
insert into videos (id, product_id, brief_id, style, content_type, duration_sec, script, caption, hashtags, publish_at, storage_path)
values ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
        'dark-keynote', 'ipucu', 20, '{"n":9}', 'c9', array['#a','#b','#c','#d','#e'], now() - interval '1 minute', 'v/9.mp4');
update videos set status='ready' where id='30000000-0000-0000-0000-000000000009';
update videos set status='approved' where id='30000000-0000-0000-0000-000000000009';
do $$ declare r videos; begin
  select * into r from claim_due_video();
  assert r.id = '30000000-0000-0000-0000-000000000009', 'onaylı video kilitlenmeli';
end $$;
select t.expect_error($$update videos set caption='yayında değişti' where id='30000000-0000-0000-0000-000000000009'$$, 'yayınlanırken');
update videos set status='approved', publish_tries = 1 where id='30000000-0000-0000-0000-000000000009';
do $$ begin
  assert (select status = 'approved' and approved_hash = content_hash from videos where id='30000000-0000-0000-0000-000000000009');
  assert (select count(*) from claim_due_video()) = 1, 'geri dönen video tekrar kilitlenebilmeli';
end $$;
update videos set status='published', ig_media_id='IG9', published_at=now() where id='30000000-0000-0000-0000-000000000009';
select t.expect_error($$insert into publish_attempts (video_id, outcome) values ('30000000-0000-0000-0000-000000000009', 'bilinmeyen')$$, 'check constraint');

\echo 'T14 metrik her kontrol noktasında video başına bir kez; eksik metrik NULL kalabilir'
insert into metrics (video_id, checkpoint, hours_after_publish, views) values ('30000000-0000-0000-0000-000000000009', 24, 25, 100);
select t.expect_error($$insert into metrics (video_id, checkpoint, hours_after_publish, views) values ('30000000-0000-0000-0000-000000000009', 24, 26, 120)$$, 'duplicate key');
select t.expect_error($$insert into metrics (video_id, checkpoint, hours_after_publish) values ('30000000-0000-0000-0000-000000000009', 48, 48)$$, 'check constraint');
insert into metrics (video_id, checkpoint, hours_after_publish) values ('30000000-0000-0000-0000-000000000009', 72, 73);
do $$ begin assert (select saved is null and likes is null from metrics where checkpoint = 72); end $$;
select t.expect_error($$insert into audience_activity (day, hour_local, followers_online) values ('2026-10-21', 24, 1)$$, 'check constraint');

\echo 'T15 otomatik mod: ilk yayından 7 gün geçmeden açılamaz; değişiklik kaydedilir'
-- Test verisindeki yayınlar bugüne ait → auto reddedilmeli
update app_settings set mode = 'approval';
select t.expect_error($$update app_settings set mode = 'auto'$$, 'en az 7 gün');
update videos set published_at = now() - interval '8 days' where id = '30000000-0000-0000-0000-000000000009';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update app_settings set mode = 'auto';
reset role;
do $$ begin
  assert (select mode = 'auto' and mode_changed_by = '00000000-0000-0000-0000-00000000000a' and mode_changed_at is not null from app_settings);
end $$;
update app_settings set mode = 'approval';

\echo 'T16 Sepet Röntgeni: konu bankası kaynağı, huni varsayılanı, konu anahtarı tekil, içerik fazı 1'
do $$ begin assert (select content_phase = 1 from app_settings); end $$;
select t.expect_error($$update app_settings set content_phase = 4$$, 'check constraint');
insert into ideas (product_id, idea, hook, content_type, source, source_ref, score, why, topic)
  select product_id, '[test-konu] Marka: mekanizma', 'Kanca', 'marka_rontgeni', 'topic_bank', 'test-konu', 70, 'test', '{"key":"test-konu"}' from ideas limit 1;
do $$ begin assert (select funnel = 'TOF' from ideas where source_ref = 'test-konu'); end $$;
select t.expect_error($$insert into ideas (product_id, idea, hook, content_type, source, source_ref, score, why)
  select product_id, '[test-konu] başka metin', 'Kanca', 'marka_rontgeni', 'topic_bank', 'test-konu', 70, 'test' from ideas limit 1$$, 'duplicate key');
select t.expect_error($$update ideas set funnel = 'XYZ' where source_ref = 'test-konu'$$, 'check constraint');
do $$ begin assert (select pg_get_constraintdef(oid) like '%15%58%' from pg_constraint where conname = 'videos_duration_sec_check'); end $$;
do $$ begin assert (select pg_get_constraintdef(oid) like '%>= 3)%<= 10)%' from pg_constraint where conname = 'videos_hashtags_check'); end $$;

create table t.done (ok int);  -- run.sh bu tablonun varlığını kontrol eder

