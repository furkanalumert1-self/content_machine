# Proje Notları (kısa, kalıcı)

## Durum
- 21.10.2026 — ADIM 0 tamamlandı → `docs/adim-0-arastirma.md`.
- 21.10.2026 — Kullanıcı "başla" dedi. ADIM 1 tamamlandı: klasör yapısı, Supabase şeması + RLS, motor temel kütüphaneleri (env, log maskeleme), CI.
- 21.10.2026 — ADIM 2 tamamlandı: brief taslağı, fikir motoru, repo/site salt okunur inceleme.
- 21.10.2026 — Kullanıcı brief'i onayladı (özet 21fae10f3cc8e260). ADIM 3 tamamlandı: günlük planlayıcı.
- 21.10.2026 — Fikir stoku için Seçenek 1: brief'e 6 mit + 15 ek ipucu eklendi; CTA hedefi cal.com yapıldı; kullanıcı brief'i yeniden onayladı (özet 047d60ce65742cf7). ADIM 4 tamamlandı: Remotion render + otomatik kalite kontrolü.
- 21.10.2026 — ADIM 5 tamamlandı: Instagram yayını (Instagram Login, şifreli token, container→durum→publish, mükerrer yayın koruması, limit/hata yönetimi, token yenileme).
- 21.10.2026 — ADIM 6 tamamlandı: yayın saati seçimi (keşif/kullan, gerekçeli) ve 24./72. saat metrik toplama.
- 21.10.2026 — ADIM 7 tamamlandı: GitHub Actions (günlük plan+render, yayın kontrolü, metrik+token, haftalık fikir, render deneme).
- 21.10.2026 — ADIM 8 tamamlandı: Telegram onay/ret (imzalı, içeriğe bağlı, yalnızca sahip), hata bildirimleri (maskeli), auto mod 7 gün kilidi, kişisel veri kuralı, güvenlik özeti (docs/guvenlik.md).
- 22.10.2026 — ADIM 9 tamamlandı: Türkçe yönetim paneli (web/), yerel Supabase ile uçtan uca test 35/35. **MVP kabul kontrolü ve kullanıcının hesap kurulumları bekleniyor.**

## Kararlar
- Instagram yöntemi: Instagram API with Instagram Login (Facebook Sayfası yok). İzinler: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`.
- Gizli değerler sohbette istenmez/alınmaz; kullanıcı izin verdi ama güvenlik için reddedildi. Kullanıcı Vercel env ve GitHub Secrets'a kendisi ekler. Instagram bağlantısı OAuth butonu ile.
- Instagram token'ı veritabanında `TOKEN_ENCRYPTION_KEY` ile şifreli tutulacak (ADIM 5); tabloya yalnızca service role erişir.
- Kullanılmayacaklar: JohnHeibel/PDoomVideo ve joeseesun/opus-video-prompts (lisans yok), Clawd karakteri (marka), pdoom ses dosyası.
- Panel (web/): brief'in asıl kaynağı veritabanı; config/products/*.md yalnızca ilk kurulumda bir kez yüklenir.

## Varsayılanlar (kullanıcı cevap vermedi, "başla" dedi — değiştirilebilir)
1. MVP stili: Dark Tech Keynote.
2. Publisher: GitHub Actions, sadece 11:45–22:45 İstanbul (Seçenek A).
3. Ücretli yapay zekâ API'si: KAPALI. Senaryo şablon + kurallarla üretilecek; açmak için açık onay gerekli.
4. Bildirim: Telegram.
5. Müzik: MVP'de yok.

## CTA kararı (kullanıcı, 21.10.2026)
- Vercel linki videoda/caption'da HİÇBİR ZAMAN gösterilmez. Hedef: https://cal.com/furkan-alumert.
- Reels'te tıklanabilir link mümkün değil (video ve caption'daki adresler tıklanmaz) → ekranda/caption'da "link profilde"; kullanıcı cal.com linkini Instagram profil bağlantısına ekler.
- Kalite kontrol: ekranda/caption'da herhangi bir web adresi varsa plan geçmez.

## Render (ADIM 4)
- Remotion 4.0.537, 1080×1920, 30 fps, H.264 yuv420p (bt709), AAC sessiz ses izi, faststart. Fontlar OFL, müzik yok.
- Remotion lisansı: birey / ≤3 çalışanlı şirket için ücretsiz; daha büyük şirket olursa ücretli lisans gerekir.
- QC: çözünürlük, fps, codec, ses, süre (±0,15 sn), boyut (50 KB–100 MB), moov başta, metin taşması (tarayıcıda ölçülür, harf çıkıntısı için 16 px tolerans), güvenli alan, altyazı kapsaması. SRT dosyası da üretilir.
- 3 deneme (1 + 2 yeniden); metin taşması gibi içerik hatasında tekrar denenmez. Başarısız → render_failed, yayınlanamaz.
- Bu makinede (4 çekirdek, GPU yok) ~20 sn video ≈ 3 dk render.

## Instagram yayını (ADIM 5)
- API: graph.instagram.com, sürüm `IG_API_VERSION` (varsayılan v26.0 — Ekim 2026 belgelerindeki örnek sürüm).
- Token AES-256-GCM ile şifreli (TOKEN_ENCRYPTION_KEY, Vercel + GitHub'da aynı). Tabloya yalnızca service role erişir.
- Video Meta'ya özel bucket'tan 6 saatlik imzalı URL ile verilir.
- Mükerrer koruma: DB kilidi (claim_due_video) + container kimliği hemen kaydedilir + publish_requested_at + belirsiz durumda container durumu sorulur (PUBLISHED → kurtar, tekrar paylaşma).
- Hata sınıfları Meta hata kodu tablosundan: limit→ertele, not_ready→bekle, container süresi doldu→yenisi, geçici→en fazla 3 deneme, token/izin→yeniden bağlan, içerik/hesap→kalıcı hata.
- Yayın sırasında içerik değiştirilemez (DB kuralı). Yarıda kalan yayınlar 20 dk sonra kurtarılır.
- Token haftada bir yenilenir; bitişe <7 gün ve yenileme başarısızsa uyarı.
- Doğrulanmadı (gerçek hesap/Supabase yok): uçtan uca canlı yayın. Sahte Instagram API'siyle 12 senaryo testli.

## Saat seçimi ve metrikler (ADIM 6)
- Adaylar: ayarlardaki aralıklar (varsayılan 12:00–14:00, 19:00–22:00), 30 dk adım, İstanbul saati; en az 45 dk ileride.
- Ölçülmüş video < 8 → keşif (en az denenen saat; eşitlikte takipçi aktifliği, sonra güne göre dönen sıra).
- Yeterli veride en yüksek ortalama etkileşimli saat (en az 2 örnekli saatler); 4 günde bir yine keşif.
- Gerekçe her zaman örnek sayısını ve "kesin değildir"/"deneme saatidir" ifadesini içerir; GitHub gecikmesi notu eklenir.
- Etkileşim puanı = izlenme + 5×beğeni + 15×kaydetme (fikir öğrenmesiyle ortak). İzlenme yoksa puan yok.
- Metrikler: 24. ve 72. saat (Meta verisi 48 saate kadar gecikebilir); kaçırılırsa 14 güne kadar alınır, 72 geçtiyse yalnız 72. Eksik metrik NULL + hangilerinin eksik olduğu ham kayıtta.
- online_followers: ≥100 takipçi, son 30 gün; saatlerin UTC−7 olduğu varsayıldı (Meta belgesi, ham örnek yok) → `ONLINE_FOLLOWERS_UTC_OFFSET` ile değiştirilebilir. Instagram Login'de gelmeyebilir; gelmezse saat seçimi onsuz çalışır.
- ig_reels_avg_watch_time birimi belgede yok → ham değer saklanır.

## Otomasyon (ADIM 7)
- Repo şu an PUBLIC → Actions ücretsiz ama loglar herkese açık ve 60 gün hareketsizlikte zamanlanmış işler kapanır. Öneri: private (tahmin ~1.000 dk/ay, kota 2.000).
- Varsayılan dal `claude/eager-curie-4lkxlk` → zamanlanmış işler bu dalda çalışır. Hepsi `vars.AUTOMATION_ENABLED == 'true'` olana kadar atlanır.
- Render GitHub makinesinde ölçüldü: 21 sn video 40,7 sn, iş toplam 1,5 dk, 9/9 QC geçti (run 39679358834).
- Yayın kontrolü yalnızca 12:07–14:52 ve 19:07–22:52 (İstanbul); ayarlardaki aralıklar değişirse publisher.yml cron'u da değişmeli.
- Acil fikir araştırması günlük işin içinde (ek token gerekmez). Panel butonları için GH_DISPATCH_TOKEN ADIM 9'da.
- actions/* v6 (v4 Node 20 uyarısı veriyordu).

## Kontrol (ADIM 8)
- Telegram onayı: getUpdates ile yayın kontrolünde işlenir (webhook ile aynı anda kullanılamaz; panelde webhook'a geçilebilir). Basışlar Telegram'da 24 saat saklanır.
- Düğme imzası: HMAC(sha256("telegram-callback:"+TOKEN_ENCRYPTION_KEY)), veri "a|r:<uuid>:<16hex>" ≤64 bayt, içerik özetine bağlı.
- Auto mod: DB tetikleyicisi; ilk yayından ≥7 gün; mode_changed_by/at kaydı.
- Telegram sınırları (core.telegram.org): mesaj 4096, URL ile video 20 MB, callback_data 64 bayt.

## Panel (ADIM 9)
- Next.js 16.4: `middleware` → `proxy.ts` (Node runtime). params/searchParams Promise. next-env.d.ts git'e girmez (`next typegen`).
- Yetki: proxy (iyimser) + `lib/dal.ts` (her sayfa/eylem: oturum + ADMIN_EMAIL + admins) + RLS. Service role yalnızca token kaydı ve imzalı URL için.
- Supabase Auth: `[auth] enable_signup=false` (kayıt kapalı) ama `[auth.email] enable_signup=true` OLMALI — bu ikincisi e-posta girişini tamamen kapatıyor (yerel testte yakalandı).
- Yönlendirmeler isteğin Host/x-forwarded-* başlığından (`lib/origin.ts`); `req.nextUrl.origin` localhost verip oturumu kaybettiriyordu.
- Vercel Hobby = ticari olmayan kişisel kullanım; panel gri alanda → kullanıcı kararı (Hobby/Pro/başka host).
- Supabase Free: 500 MB DB, 1 GB dosya, 5 GB egress, 7 gün hareketsizlikte duraklatma.
- E2E: web/e2e/panel.e2e.mjs (yerel Supabase + iki panel örneği); başta yerel veriyi sıfırlar, canlıda çalışmaz.

## Brief onayı (panel gelene kadar — artık panelden)
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
- **Fikir stoku:** Seçenek 1 sonrası 45 fikir → 90 günlük simülasyonda 41 gün kesintisiz, 42.–60. günler (19 gün) fikir yok, sonra döngü. Kalıcı çözüm: daha fazla brief maddesi veya yapay zekâ API'si.
- Bu oturumun ağı eklenmemiş repolar için GitHub API'yi engelliyor (403); kuru çalıştırma `--local` ile klondan okur. Actions'ta API çalışır.
- Yapay zekâ API'si kapalıyken fikir metinleri brief cümlelerinden kalıpla türetilir; bazıları kalıp gibi duruyor, mini demo hook'ları uzun. Senaryo aşamasında (ADIM 3) kısaltılacak.
- Trend kaynağı yok: resmi bir arama/haber API'si (ücretsiz katmanlı) onayla eklenebilir.
- DB'ye yazan işler (brief-sync, idea-research) Supabase projesi açılınca uçtan uca denenecek; şu an saf mantık birim testli, şema yerel Postgres'te testli.
- Yerelde root ile `initdb` çalışmaz → şema testleri `runuser -u postgres` ile.
- CI her push'ta ~1–2 Actions dakikası harcar (sadece kod değişince; .md/docs hariç).

## Canlı kurulum (başladı)
- Supabase projesi oluşturuldu (URL erişilebilir; tablolar henüz yok — 404). Tablolar `supabase/kurulum.sql` ile SQL Editor'den kurulur.
- `supabase/kurulum.sql` = migration'ların birleşimi (tek işlem). `scripts/build-supabase-setup.sh` üretir; şema testi dosyanın güncel olduğunu kontrol eder ve aynısını çalıştırır.
- Sohbete veritabanı şifresi yazıldı → kullanılmadı; kullanıcıya şifreyi sıfırlaması önerildi.
- Supabase canlı kontrol (publishable key ile): 11 tablo var, RLS dışarıya boş döner, instagram_connection reddedilir, claim_due_video çağrılamaz, kayıt kapalı (signup 422), admins satırı kullanıcı tarafından doğrulandı. Sıradaki: Vercel.
- Kullanıcı isteğiyle giriş e-posta bağlantısı yerine **e-posta + şifre** oldu (bağlantı canlıda açılmadı; ayrıca başka tarayıcıda açılınca PKCE nedeniyle çalışmaz). `/auth/callback` kaldırıldı. ADMIN_EMAIL dışı e-posta Supabase'e sorulmaz; tek hata mesajı ("E-posta veya şifre hatalı"). Hesap Supabase → Users → Create new user (şifreli) ile açılır.
- Panel: https://contentmachine-web-azure.vercel.app (yönlendirme, güvenlik başlıkları, JS'te gizli anahtar yok — canlı kontrol edildi).
- ADMIN_EMAIL artık virgülle birden çok e-posta alır (her biri admins tablosunda da olmalı). Onaylanmamış hesap için ayrı mesaj (Supabase bunu yalnızca şifre doğruysa döndürür — yerelde doğrulandı).
