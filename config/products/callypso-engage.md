---
product: callypso-engage
status: onaylı
approved_hash: 21fae10f3cc8e260
approved_at: 2026-10-21T20:26:00.115Z
---
# Callypso Engage — Brief

## Ürün
E-ticaret markalarının **mevcut müşterilerini** davranış ve satın alma verisine göre segmentleyip Email + SMS otomasyonlarıyla geri kazanmasını sağlayan retention platformu. Cold outreach aracı değildir. (Kaynak: site meta açıklaması, `app.config.ts`)

## Hedef kitle
- E-ticaret marka sahipleri — önce Türkiye, sonra Avrupa. (Kaynak: kullanıcı tanımı)
- Retention / growth pazarlamacıları. (Kaynak: kullanıcı tanımı)
- Ortak nokta: zaten müşterisi olan, ilk satıştan sonrasını büyütmek isteyen ekipler. (Kaynak: site "Cold outreach değil — mevcut müşterilerine odaklı")

## Acı noktaları
1. **İkinci alışveriş gelmiyor** — Müşteri bir kez alıyor, sonra sessizce kayboluyor. Hook: "İlk siparişten sonra müşterin nereye gidiyor?" → Özellik 1
2. **Herkese aynı toplu mail** — VIP müşteri de ilk kez gelen de aynı e-postayı alıyor. Hook: "Herkese aynı maili atıyorsan, kimseye yazmıyorsun." → Özellik 1
3. **Terk edilmiş sepet** — Sepete eklenen ürün ödeme adımında kalıyor. Hook: "Sepette bekleyen ürünler sana bir şey söylüyor." → Özellik 2
4. **Email ve SMS ayrı araçlarda** — İki kanal, iki panel, iki ayrı kitle listesi. Hook: "Email bir yerde, SMS başka yerde. Müşterin ise tek kişi." → Özellik 3
5. **İzin takibi dağınık** — Kimin hangi kanaldan ileti almaya izin verdiği net değil. Hook: "Gönder'e basmadan önce: bu kişi izin verdi mi?" → Özellik 3 (Kaynak: site SSS "Gönderim öncesi onaylı alıcı sayısı gösterilir")

## Doğrulanmış özellikler
Hepsi üründe ekran olarak var ve demo modunda çalışıyor (Kaynak: ürün reposu commit'leri).
1. **Davranışsal segmentler** — VIP, Yüksek LTV, Terk edilmiş sepet, Churn riski, Pasif, Tekrar satın alma zamanı, İlk kez alan; kural tabanlı segment oluşturucu. İpucu: "Önce 'İlk kez alanlar' segmentini ayır; ikinci siparişe giden yol oradan başlar." (Kaynak: 9b1ddc8, 787e796)
2. **Kanal bağımsız otomasyon akışları** — Email gönder, SMS gönder, Bekle, Koşul, Satın alma kontrolü ve Onay kontrolü adımları tek akışta. İpucu: "Terk edilmiş sepet akışına 'Satın alma kontrolü' ekle; zaten alan kişiye hatırlatma gitmesin." (Kaynak: 9b1ddc8)
3. **Email + SMS kampanya oluşturucu** — Aynı kitle ve segmentler iki kanalda; gönderim öncesi onaylı alıcı sayısı, test gönderimi, zamanlama. İpucu: "Göndermeden önce onaylı alıcı sayısına bak; izin yoksa o kişiye ileti gitmez." (Kaynak: 787e796, 9b1ddc8)
4. **Customer 360 profili** — LTV, ortalama sepet (AOV), sipariş sayısı, son satın alma, kanal izinleri ve olay zaman çizelgesi tek profilde. İpucu: "Kampanyadan önce bir müşterinin zaman çizelgesine bak; segmenti o zaman daha iyi anlarsın." (Kaynak: 9b1ddc8)
5. **Şablonlar ve izinli formlar** — Kişiselleştirme değişkenli hazır e-posta/SMS şablonları; pazarlama izni ayrı ve varsayılan olarak işaretsiz kayıt formları. İpucu: "Pazarlama izni kutusunu önceden işaretleme; izin, kişinin kendi tıkıdır." (Kaynak: 9600093, 272800c)

## Mitler
1. **Mit:** "Daha çok e-posta, daha çok satış demektir." — **Gerçek:** Önemli olan sayı değil, doğru kişiye doğru zamanda gitmesi. Segment bunun için var.
2. **Mit:** "Retention sadece büyük markaların işi." — **Gerçek:** Küçük markada her tekrar eden müşteri daha da değerli; tek bir akışla başlanabilir.
3. **Mit:** "SMS herkese atılır, izin gerekmez." — **Gerçek:** Ticari ileti için alıcının izni gerekir; gönderim öncesi izin kontrolü şart.
4. **Mit:** "Terk edilen sepet kaybedilmiş satıştır." — **Gerçek:** Sepet, müşterinin ne istediğini gösteren bir sinyaldir; hatırlatma akışıyla takip edilebilir.

## Ton
Sade, net, Türkçe. Pazarlamacıya akran gibi konuşur; abartmaz, bağırmaz. Teknik terimi ilk geçtiğinde kısaca açıklar (LTV = müşterinin toplam getirdiği gelir). Kısa cümleler, ekran başına tek fikir.

## CTA
"Canlı demoyu dene" — giriş yapmadan demo modu açılır: callypso-engage.vercel.app

## Yasak konular
- Kanıtlanmamış "%X artış" veya gelir vaadi.
- Demo rakamlarını (48.920 müşteri, +%18, %42,6, +%30) gerçek sonuç gibi göstermek. Ekranda demo verisi görünürse "örnek veri" etiketi zorunlu.
- Cold outreach, satın alınmış liste, izinsiz ileti çağrışımı. Inboxly ile karıştırmak.
- Rakip adı anmak veya kötülemek (sitedeki karşılaştırma tablosu dahil).
- Gerçek müşteri verisi, gerçek kişi adı veya e-postası.
- KVKK/İYS uyumunu "biz hallederiz" diye garanti etmek veya hukuki tavsiye vermek.
- Fiyat söylemek (değişebilir, doğrulanmadı).
- Aşağıdaki doğrulanmamış özellikler.

## Doğrulanmamış (videoda söylenmeyecek)
- **Mağaza senkronu (Shopify vb.):** sitede SSS'de var ama kodda yalnızca ayar yer tutucusu; çalışan entegrasyon yok.
- **Gerçek İYS entegrasyonu:** yok. Söylenebilecek en fazla: "İYS'ye hazır izin takibi".
- **WhatsApp kanalı:** yalnızca demo; gerçek Meta bağlantısı yok.
- **Gerçek SMS gönderimi:** SMS sağlayıcısı bağlı değil (demo).
- **Veritabanı:** Supabase hazırlığı var ama bağlı değil; veriler tarayıcıda tutuluyor.

## Marka
- Renkler: lacivert `#0F1B33` → `#1B2F52`, camgöbeği `#5FD4E6`, ana vurgu indigo `oklch(58% 0.16 275)`.
- Fontlar (sitede): Outfit, JetBrains Mono — ikisi de SIL Open Font License; videoda kullanılabilir.
- Logo: ürün reposunda `public/logo.svg` (lacivert rozet + camgöbeği "nabız").

## Kaynaklar
- Canlı site ana sayfa (21.10.2026): başlık, açıklama, SSS. robots.txt yok (404).
- Ürün reposu `furkanalumert1-self/callypso_engage` @ `9bccef1`: `app.config.ts`, rota listesi, son 7 commit (27.08–09.09.2026). README genel başlangıç kiti metni olduğu için kullanılmadı. `.env*` dosyaları okunmadı; gizli anahtar taraması temiz.
- Son 14 günde yeni commit yok → şu an "yeni özellik duyurusu" fikri üretilmeyecek.
