# content_machine

Callypso Engage için her gün kodla üretilen 9:16 Reels videosu hazırlayan, onayınızla Instagram'a paylaşan ve performanstan öğrenen kişisel sistem. Yönetim paneli Türkçedir; bilgisayarınız kapalıyken GitHub Actions'ta çalışır.

> Durum: **ADIM 9 tamamlandı** (yönetim paneli). Brief onaylı. Ayrıntı: [`NOTLAR.md`](NOTLAR.md)

## Nasıl çalışır?
```
08:41  Günlük iş: fikir + senaryo + yayın saati seçilir → video üretilir → kalite kontrolü
       → Panel "Kuyruk" ve Telegram'da onayınıza sunulur
       Siz: Onayla / Reddet / Düzenle / Saati değiştir
12:07–14:52 · 19:07–22:52  15 dk'da bir: zamanı gelmiş ONAYLI video Instagram'a gider
10:17  Metrikler (yayından 24 ve 72 saat sonra) + Instagram token kontrolü
Pazartesi 07:23  Haftalık fikir araştırması
```

## Kurulum (sırayla)
1. **Supabase + Vercel (panel):** [docs/kurulum/supabase-vercel.md](docs/kurulum/supabase-vercel.md)
2. **Instagram / Meta uygulaması:** [docs/kurulum/instagram.md](docs/kurulum/instagram.md) — profil bağlantınıza `https://cal.com/furkan-alumert` ekleyin (videolar "link profilde" der).
3. **Telegram (onay düğmeleri + bildirim):** [docs/kurulum/telegram.md](docs/kurulum/telegram.md)
4. **GitHub Secrets + `AUTOMATION_ENABLED`:** [docs/kurulum/github-actions.md](docs/kurulum/github-actions.md)
5. **İlk çalıştırma:** [supabase-vercel.md › İlk çalıştırma](docs/kurulum/supabase-vercel.md#3-ilk-çalıştırma)

Gizli değerleri **sohbete veya koda yazmayın**; Vercel Environment Variables ve GitHub Secrets'a siz eklersiniz. Değişken adları: [`.env.example`](.env.example).

## Günlük kullanım
- **Sabah:** Telegram'a (veya panelde **Kuyruk**'a) yeni video gelir. İzleyin, caption ve saat gerekçesini okuyun.
- **Onayla** → planlanan saatten sonraki ilk yayın kontrolünde paylaşılır. **Reddet** → asla paylaşılmaz.
- **Düzenle:** caption/hashtag değişirse önceki onay geçersiz olur, yeniden onaylarsınız. **Saati değiştir** onayı bozmaz. **Yeniden üret** yeni video üretir (yeniden onay gerekir).
- **Video iste:** talimat yazın (ilk cümle = ilk 2 saniyedeki hook) veya boş bırakın; **Hemen üret** ya da **Kuyruğa ekle**.
- **Performans:** izlenme/beğeni/kaydetme ve ürün, içerik türü, stil, saat karşılaştırması. **Fikir bankası:** fikirler, puanlar, gerekçeler; elle ekle/sil.
- **Ürünler:** "Senkronize et" → repo + canlı site (+ Vercel) okunur → brief taslağı; inceleyip onaylarsınız. Onaylanmamış brief içerikte kullanılmaz.

## Onay ve güvenlik
- Varsayılan **onaylı mod**: onaylamadığınız video yayınlanmaz. **Otomatik mod** ilk yayından en az 7 gün sonra ve yalnızca sizin açık tercihinizle açılabilir.
- Videolarda yasaklar otomatik denetlenir: kanıtlanmamış % vaadi, demo rakamı, rakip adı, fiyat, web adresi, kişisel veri, doğrulanmamış özellik. Demo ekranları "örnek veri" etiketlidir.
- Panele yalnızca sizin hesabınız girer (kayıt kapalı; şifresiz e-posta bağlantısı). Ayrıntı: [docs/guvenlik.md](docs/guvenlik.md).

## Durdurma
- **Panel → Ayarlar → Tüm yayınları durdur (PAUSED):** hiçbir video yayınlanmaz; yayından hemen önce de kontrol edilir. Üretim sürer.
- **Tamamen kapatmak:** GitHub → Settings → Secrets and variables → Actions → Variables → `AUTOMATION_ENABLED` = `false`.

## Hata giderme
| Belirti | Ne yapmalı |
|---|---|
| Telegram'a "🚨" mesajı geldi | Mesaj neyin başarısız olduğunu söyler; panelde ilgili video kartında ayrıntı ve **Yeniden üret** var. |
| "Instagram bağlantısı geçersiz" / token uyarısı | Panel → Ayarlar → **Yeniden bağla**. |
| Video "Üretim başarısız" | Kartta kalite kontrol nedeni yazar; **Yeniden üret**. 3 denemeden sonra otomatik denenmez. |
| Onayladım ama yayınlanmadı | Planlanan saat yayın aralığının dışında olabilir (bir sonraki aralıkta gider) veya PAUSED açık. GitHub zamanlaması birkaç dakika gecikebilir. |
| "Kullanılabilir fikir yok" | Fikir bankasından fikir ekleyin veya brief'e mit/ipucu ekleyip onaylayın. |
| Panel girişi / kurulum sorunları | [supabase-vercel.md › Sorun giderme](docs/kurulum/supabase-vercel.md#sorun-giderme) |

## Maliyet (ücretli hiçbir şey açılmadı)
| Hizmet | Plan | Not |
|---|---|---|
| GitHub Actions | Repo herkese açık → ücretsiz | Özel yapılırsa ~1.000 dk/ay (kota 2.000). **Özel yapmanız önerilir** ([neden](docs/kurulum/github-actions.md#önerim-repoyu-özel-private-yapın)). |
| Supabase | Free | 500 MB veritabanı, 1 GB dosya (günde ~1,5 MB video → 1,5 yıldan fazla). 7 gün hareketsiz projeyi duraklatır; günlük işler aktif tutar. |
| Vercel | Hobby (ücretsiz) | ⚠️ Yalnızca ticari olmayan kişisel kullanım; bu panel gri alanda. Karar sizde: Hobby / Pro / başka barındırma ([ayrıntı](docs/kurulum/supabase-vercel.md#2-vercel-panel)). |
| Remotion | Ücretsiz lisans | Birey / ≤3 çalışanlı şirket için. |
| Instagram API, Telegram | Ücretsiz | — |

## Belgeler
[Mimari](docs/mimari.md) · [ADIM 0 araştırma](docs/adim-0-arastirma.md) · [Güvenlik](docs/guvenlik.md) · [Callypso Engage brief](config/products/callypso-engage.md) · [Örnek fikirler](docs/ornek-fikirler-callypso-engage.md) · [Örnek 7 günlük plan](docs/ornek-plan-callypso-engage.md)

## Geliştirici için
```bash
npm install
npm run typecheck
npm run test -w engine && npm run test -w web       # birim testleri
runuser -u postgres -- bash supabase/tests/run.sh   # şema testleri (yerel Postgres; root değilseniz runuser'sız)
```
Uçtan uca test (Docker gerekir): `supabase start` (CLI) → `web/.env.local` (yerel anahtarlar, `.env.example`'a bakın) → `npm run build -w web` → paneli 3000 (ADMIN_EMAIL'li) ve 3001 (`ADMIN_EMAIL=` boş) portlarında başlatın → `E2E_DB=… SUPABASE_URL=… ANON_KEY=… SERVICE_ROLE_KEY=… npm run e2e -w web`. Betik yalnızca yerel veritabanında çalışır (başta test verisini sıfırlar).
