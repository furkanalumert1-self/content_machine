-- Güvenlik ve kontrol: otomatik mod kilidi, mod değişikliği kaydı, Telegram okuma konumu.
alter table app_settings add column mode_changed_at timestamptz;
alter table app_settings add column mode_changed_by uuid references auth.users (id);
alter table app_settings add column telegram_update_offset bigint not null default 0;

-- MODE=auto yalnızca: ilk yayından en az 7 gün geçtiyse ve değişiklik açıkça yapılıyorsa (kim/ne zaman kaydedilir).
create or replace function settings_guard() returns trigger language plpgsql as $$
begin
  if new.mode is distinct from old.mode then
    if new.mode = 'auto' and not exists (
      select 1 from videos where status = 'published' and published_at <= now() - interval '7 days'
    ) then
      raise exception 'Otomatik mod, ilk yayından en az 7 gün sonra açılabilir. İlk haftalarda onaylı mod kullanılmalı.';
    end if;
    new.mode_changed_at := now();
    new.mode_changed_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger settings_guard before update on app_settings
  for each row execute function settings_guard();
