# content_machine

Callypso Engage için her gün kodla üretilen 9:16 Reels videosu hazırlayan, onayınızla Instagram'a paylaşan ve performanstan öğrenen kişisel sistem.

> Durum: **ADIM 6 tamamlandı** (yayın saati seçimi + metrikler). Brief onaylı (özet 047d60ce65742cf7). Ayrıntı: [`NOTLAR.md`](NOTLAR.md)

## Belgeler
- [Mimari](docs/mimari.md)
- [ADIM 0 araştırma özeti](docs/adim-0-arastirma.md)
- [Instagram kurulum rehberi](docs/kurulum/instagram.md)
- [Callypso Engage brief taslağı](config/products/callypso-engage.md) · [örnek fikirler](docs/ornek-fikirler-callypso-engage.md) · [örnek 7 günlük plan](docs/ornek-plan-callypso-engage.md)

## Kurulum (adımlar ilerledikçe tamamlanacak)
1. Supabase projesi açın ve `supabase/migrations/` içindeki dosyaları sırayla (0001, 0002…) SQL Editor'de çalıştırın. *(ADIM 9'da ayrıntılı anlatılacak.)*
2. Instagram'ı hazırlayın: [rehber](docs/kurulum/instagram.md). Profil bağlantısına `https://cal.com/furkan-alumert` ekleyin (videolar "link profilde" der).
3. Gizli anahtarları ekleyin: değişken adları [`.env.example`](.env.example) içinde. Değerleri **sohbete veya koda yazmayın**; Vercel Environment Variables ve GitHub Secrets'a siz eklersiniz.

## Günlük kullanım · Onay · Durdurma · Hata giderme · Maliyet
İlgili adımlar tamamlandıkça bu bölümler doldurulacak. Şimdiden bilinenler:
- **Yayın saati:** Sistem her video için İstanbul saatine göre bir saat seçer ve gerekçesini yazar. İlk haftalarda 12:00–14:00 ve 19:00–22:00 arasında farklı saatleri dener; bunlar kanıtlanmış en iyi saatler değildir. Yeterli veri birikince (en az 8 ölçülmüş video) en iyi ortalamaya yönelir, 4 günde bir yeniden dener.
- **Gecikme:** Yayın kontrolü GitHub Actions ile 15 dakikada bir çalışır; GitHub zamanlaması yoğunlukta birkaç dakika (bazen daha fazla) gecikebilir. Kesin dakika garantisi yoktur. Onayınız seçilen saatten sonra gelirse video bir sonraki kontrolde yayınlanır.
- **Metrikler:** Yayından 24 ve 72 saat sonra izlenme, erişim, beğeni, yorum, kaydetme, paylaşım alınır. Meta'nın vermediği metrik boş kalır, tahmin edilmez.
- **Durdurma:** Panel > Ayarlar > `PAUSED` açıkken hiçbir video yayınlanmaz (veritabanı seviyesinde engellenir).
- **Maliyet:** GitHub Free'de private repo için ayda 2.000 Actions dakikası var. Plan ~1.700 dk/ay. Ayrıntı: [araştırma §4](docs/adim-0-arastirma.md).

## Geliştirici için
```bash
npm install
npm test           # motor birim testleri + veritabanı şema testleri (yerel Postgres gerekir)
npm run typecheck
```
Root kullanıcıyla çalışıyorsanız şema testleri: `runuser -u postgres -- bash supabase/tests/run.sh`
