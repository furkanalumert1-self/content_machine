# Proje Notları (kısa, kalıcı)

## Durum
- 21.10.2026 — ADIM 0 tamamlandı → `docs/adim-0-arastirma.md`.
- 21.10.2026 — Kullanıcı "başla" dedi. ADIM 1 tamamlandı: klasör yapısı, Supabase şeması + RLS, motor temel kütüphaneleri (env, log maskeleme), CI.
- 21.10.2026 — ADIM 2 tamamlandı: brief taslağı, fikir motoru, repo/site salt okunur inceleme.
- 21.10.2026 — Kullanıcı brief'i onayladı (özet 21fae10f3cc8e260). ADIM 3 tamamlandı: günlük planlayıcı (ürün/tür/fikir/stil seçimi, senaryo, caption, hashtag, süre, gerekçe). **ADIM 4 onayı bekleniyor.**

## Kararlar
- Instagram yöntemi: Instagram API with Instagram Login (Facebook Sayfası yok). İzinler: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`.
- Gizli değerler sohbette istenmez/alınmaz; kullanıcı izin verdi ama güvenlik için reddedildi. Kullanıcı Vercel env ve GitHub Secrets'a kendisi ekler. Instagram bağlantısı OAuth butonu ile.
- Instagram token'ı veritabanında `TOKEN_ENCRYPTION_KEY` ile şifreli tutulacak (ADIM 5); tabloya yalnızca service role erişir.
- Kullanılmayacaklar: JohnHeibel/PDoomVideo ve joeseesun/opus-video-prompts (lisans yok), Clawd karakteri (marka), pdoom ses dosyası.
- Panel (web/) ADIM 9'da kurulacak; ADIM 1'de sadece yer tutucu.

## Varsayılanlar (kullanıcı cevap vermedi, "başla" dedi — değiştirilebilir)
1. MVP stili: Dark Tech Keynote.
2. Publisher: GitHub Actions, sadece 11:45–22:45 İstanbul (Seçenek A).
3. Ücretli yapay zekâ API'si: KAPALI. Senaryo şablon + kurallarla üretilecek; açmak için açık onay gerekli.
4. Bildirim: Telegram.
5. Müzik: MVP'de yok.

## Brief onayı (panel gelene kadar)
- Kullanıcı sohbette onaylar → `npx tsx engine/src/jobs/brief-approve.ts <slug>` dosyaya metnin özetini yazar → commit.
- Metin sonradan değişirse özet tutmaz, onay kendiliğinden düşer; `brief-sync` yeni taslak sürüm açar.

## Callypso Engage bulguları (repo @ 9bccef1)
- Son commit 09.09.2026; son 14 günde yeni özellik yok.
- Doğrulanmamış (videoda yok): mağaza senkronu, gerçek İYS entegrasyonu, WhatsApp (demo), gerçek SMS gönderimi.
- Sitede rakip karşılaştırma tablosu var → videolarda rakip anılmaz. Sitedeki CTA "Canlı demoyu gör"; videoda kullanıcının istediği "Canlı demoyu dene".

## Planlayıcı kuralları (ADIM 3)
- İçerik türü: son 14 günde en uzun süredir kullanılmayan tür. Keşif günü türden önce gelir.
- Senaryo kurala uymazsa (yasaklı ifade, uzun satır, süre, CTA, hashtag) veya son 3 videodaki bir anlatım cümlesini tekrar ederse fikir o gün atlanır; 15 denemede olmazsa plan yapılmaz.
- Tekrar çalıştırılabilir: bugün için `daily_video_count` kadar otomatik video varsa çıkar. Eşzamanlı çalışmayı Actions concurrency engelleyecek (ADIM 7).
- `publish_at` ADIM 6'da seçilecek; şimdilik boş.

## Bilinen sınırlamalar
- **Fikir stoku:** yapay zekâ API'si kapalıyken onaylı brief'ten en fazla ~24 farklı fikir çıkar → günde 1 videoyla ~3,5 hafta. Sonra 60 gün tekrar yasağı dolana kadar fikir kalmaz. Çözüm seçenekleri kullanıcıya soruldu (brief'e madde eklemek / API'yi açmak / tekrar süresini kısaltmak).
- Bu oturumun ağı eklenmemiş repolar için GitHub API'yi engelliyor (403); kuru çalıştırma `--local` ile klondan okur. Actions'ta API çalışır.
- Yapay zekâ API'si kapalıyken fikir metinleri brief cümlelerinden kalıpla türetilir; bazıları kalıp gibi duruyor, mini demo hook'ları uzun. Senaryo aşamasında (ADIM 3) kısaltılacak.
- Trend kaynağı yok: resmi bir arama/haber API'si (ücretsiz katmanlı) onayla eklenebilir.
- DB'ye yazan işler (brief-sync, idea-research) Supabase projesi açılınca uçtan uca denenecek; şu an saf mantık birim testli, şema yerel Postgres'te testli.
- Yerelde root ile `initdb` çalışmaz → şema testleri `runuser -u postgres` ile.
- CI her push'ta ~1–2 Actions dakikası harcar (sadece kod değişince; .md/docs hariç).
