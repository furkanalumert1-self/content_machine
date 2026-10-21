-- Instagram yayını: mükerrer yayın koruması ve yeniden deneme durumu.
alter table videos add column publish_tries int not null default 0;
alter table videos add column publish_requested_at timestamptz; -- media_publish çağrısından hemen önce yazılır
alter table videos add column ig_permalink text;

alter table publish_attempts drop constraint publish_attempts_outcome_check;
alter table publish_attempts add constraint publish_attempts_outcome_check
  check (outcome in ('published', 'failed', 'skipped_paused', 'retry', 'postponed', 'recovered'));

comment on column instagram_connection.access_token is 'AES-256-GCM ile şifreli (TOKEN_ENCRYPTION_KEY). Düz metin token asla saklanmaz.';
alter table instagram_connection add column token_status text not null default 'ok'
  check (token_status in ('ok', 'refresh_failed', 'expired', 'revoked'));

-- Güncelleme kuralları (0001'deki fonksiyonun yerine):
-- + Yayın sırasında (publishing) içerik değiştirilemez.
-- + publishing → approved geri dönüşü (geçici hata/PAUSED) onay hâlâ geçerliyse serbest.
create or replace function video_update_guard() returns trigger language plpgsql as $$
begin
  if old.status = 'published' and new.status <> 'published' then
    raise exception 'Yayınlanmış video geri alınamaz.';
  end if;

  new.content_hash := video_content_hash(new);
  new.updated_at := now();

  if old.status = 'publishing' and new.content_hash <> old.content_hash then
    raise exception 'Video yayınlanırken içeriği değiştirilemez.';
  end if;

  if new.content_hash <> old.content_hash and old.status in ('approved', 'ready', 'rejected') then
    new.approved_hash := null;
    new.approved_at := null;
    if new.status = 'approved' then
      new.status := 'ready';
    end if;
  end if;

  if new.status = 'approved' and old.status <> 'approved' then
    if old.status = 'publishing' and old.approved_hash = new.content_hash then
      null; -- onay korunarak kuyruğa geri dönüş
    elsif old.status <> 'ready' then
      raise exception 'Yalnızca hazır (ready) video onaylanabilir; mevcut durum: %.', old.status;
    else
      new.approved_hash := new.content_hash;
      new.approved_at := now();
    end if;
  end if;
  return new;
end $$;
