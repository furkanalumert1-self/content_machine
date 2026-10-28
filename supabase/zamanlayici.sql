-- Sepet Röntgeni zamanlayıcısı: GitHub'ın zamanlanmış işleri gecikip atlandığı için işleri
-- Supabase'in kendi zamanlayıcısı (pg_cron) dakikasında başlatır (GitHub workflow_dispatch).
-- Videoyu üretme/yayınlama yine GitHub Actions'ta çalışır; GitHub'ın kendi zamanlaması yedek olarak kalır.
-- Aynı iş iki kez başlasa da sorun olmaz: planlayıcı günde bir video planlar, yayın veritabanı kilidiyle tek sefer yapılır.
-- Kurulum: docs/kurulum/zamanlayici.md. Tekrar çalıştırılabilir (iş adları aynı kalır, üzerine yazılır).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- API'den (PostgREST) erişilemeyen ayrı şema.
create schema if not exists zamanlayici;
revoke all on schema zamanlayici from public, anon, authenticated;

-- GitHub'a "şu işi şimdi başlat" isteği. Token Supabase Vault'ta "github_dispatch_token" adıyla durur; burada yazılmaz.
create or replace function zamanlayici.gh_dispatch(workflow text, inputs jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  tok text;
begin
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'github_dispatch_token' limit 1;
  if tok is null then
    raise warning 'Vault''ta github_dispatch_token yok; % başlatılamadı.', workflow;
    return null;
  end if;
  return net.http_post(
    url := 'https://api.github.com/repos/furkanalumert1-self/content_machine/actions/workflows/' || workflow || '/dispatches',
    body := jsonb_build_object('ref', 'claude/eager-curie-4lkxlk', 'inputs', inputs),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || tok,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'sepet-rontgeni-zamanlayici',
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 10000
  );
end $$;
revoke all on function zamanlayici.gh_dispatch(text, jsonb) from public, anon, authenticated;

-- Saatler UTC (İstanbul = UTC+3, yaz saati yok).
select cron.schedule('sr-gunluk-video',  '41 5 * * *',               $$select zamanlayici.gh_dispatch('daily.yml', '{"mode":"plan_and_render"}')$$); -- 08:41
-- Yayın aralıkları 28.10: 13:00–16:00 ve 19:00–21:00. Eski işler kaldırılır.
select cron.unschedule(jobid) from cron.job where jobname in ('sr-yayin-ogle', 'sr-yayin-sabah');
select cron.schedule('sr-yayin-ogleden-sonra', '7,22,37,52 10-12 * * *', $$select zamanlayici.gh_dispatch('publisher.yml')$$);                  -- 13:07–15:52
select cron.schedule('sr-yayin-aksam',   '7,22,37,52 16-17 * * *',   $$select zamanlayici.gh_dispatch('publisher.yml')$$);                         -- 19:07–20:52
select cron.schedule('sr-yayin-son',     '7 13,18 * * *',            $$select zamanlayici.gh_dispatch('publisher.yml')$$);                         -- 16:07 ve 21:07 (aralık sonuna planlanan video kaçmasın)
select cron.schedule('sr-metrikler',     '17 7 * * *',               $$select zamanlayici.gh_dispatch('metrics.yml')$$);                           -- 10:17
select cron.schedule('sr-fikirler',      '23 4 * * 1',               $$select zamanlayici.gh_dispatch('ideas.yml')$$);                             -- Pazartesi 07:23

select jobname, schedule from cron.job where jobname like 'sr-%' order by jobname;
