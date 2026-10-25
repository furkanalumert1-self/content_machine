-- Sepet Röntgeni içerik planı (docs/icerik-plani.md): içerik sütunları, huni katmanı, kaynaklı konu bankası, içerik fazı.
-- Yeni enum değerleri bu dosyada kullanılmaz (aynı işlemde kullanılamazlar).

alter type content_type add value if not exists 'marka_rontgeni';
alter type content_type add value if not exists 'fiyat_psikolojisi';
alter type content_type add value if not exists 'magazana_kur';

alter table ideas drop constraint if exists ideas_source_check;
alter table ideas add constraint ideas_source_check
  check (source in ('changelog', 'audience', 'trend', 'performance', 'manual', 'deployment', 'topic_bank'));

-- Var olan (brief'ten üretilmiş ürün tanıtımı) fikirler BOF sayılır; yeni fikirlerin varsayılanı TOF.
alter table ideas add column funnel text not null default 'BOF' check (funnel in ('TOF', 'MOF', 'BOF'));
alter table ideas alter column funnel set default 'TOF';
-- Konu bankası fikirlerinde doğrulanmış senaryo içeriği ve kaynakları.
alter table ideas add column topic jsonb;
create unique index ideas_topic_key on ideas (product_id, source_ref) where source = 'topic_bank';

-- 1 trafik (ürün adı geçmez, BOF yok), 2 lead, 3 dönüşüm (BOF feed'e girebilir).
alter table app_settings add column content_phase smallint not null default 1 check (content_phase between 1 and 3);

-- Sepet Röntgeni videoları 45–58 sn (ürün videoları 15–45 sn olarak kalır).
alter table videos drop constraint if exists videos_duration_sec_check;
alter table videos add constraint videos_duration_sec_check check (duration_sec between 15 and 58);

-- İçerik planı 3–5 hashtag öneriyor (ürün videoları 5–10 kullanmaya devam eder).
alter table videos drop constraint if exists videos_hashtags_check;
alter table videos add constraint videos_hashtags_check check (cardinality(hashtags) between 3 and 10);
