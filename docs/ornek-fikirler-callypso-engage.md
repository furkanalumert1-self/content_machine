# Örnek fikirler — Callypso Engage

Üretim: 2026-10-21 · kuru çalıştırma (veritabanına yazılmadı) · brief durumu: onaylı

## Okunan kaynaklar
- Repo `furkanalumert1-self/callypso_engage` @ `9bccef1`: 7 commit, 17 sayfa (/, /analytics, /audience, /automations, /campaigns, /dashboard, /deliverability, /email, /f/[id], /forms, /login, /settings, /signup, /sms, /templates, /u/[email], /whatsapp), 0 release, docs/: 0 dosya
- Site https://callypso-engage.vercel.app/: "Callypso Engage — Müşterilerini segmentle, Email + SMS ile geri kazan." — 34 başlık

## Notlar
- Son 14 günde yeni özellik commit'i yok; duyuru fikri üretilmedi.
- Trend kaynağı yapılandırılmadı; trend fikri üretilmedi.
- Veri yetersiz: metriği olan 0 video var, öğrenme için en az 10 gerekli.

## Fikirler (20)

| # | Puan | Tür | Keşif | Hook (ilk 2 sn) | Fikir | Neden |
|---|---|---|---|---|---|---|
| 1 | 71 | Problem→çözüm |  | İlk siparişten sonra müşterin nereye gidiyor? | İkinci alışveriş gelmiyor: Davranışsal segmentler ile çözüm | Brief'teki acı noktası "İkinci alışveriş gelmiyor", doğrulanmış özellik "Davranışsal segmentler" ile eşleşiyor. |
| 2 | 71 | Problem→çözüm |  | Herkese aynı maili atıyorsan, kimseye yazmıyorsun. | Herkese aynı toplu mail: Davranışsal segmentler ile çözüm | Brief'teki acı noktası "Herkese aynı toplu mail", doğrulanmış özellik "Davranışsal segmentler" ile eşleşiyor. |
| 3 | 71 | Problem→çözüm |  | Sepette bekleyen ürünler sana bir şey söylüyor. | Terk edilmiş sepet: Kanal bağımsız otomasyon akışları ile çözüm | Brief'teki acı noktası "Terk edilmiş sepet", doğrulanmış özellik "Kanal bağımsız otomasyon akışları" ile eşleşiyor. |
| 4 | 71 | Problem→çözüm |  | Email bir yerde, SMS başka yerde. Müşterin ise tek kişi. | Email ve SMS ayrı araçlarda: Email + SMS kampanya oluşturucu ile çözüm | Brief'teki acı noktası "Email ve SMS ayrı araçlarda", doğrulanmış özellik "Email + SMS kampanya oluşturucu" ile eşleşiyor. |
| 5 | 71 | Problem→çözüm |  | Gönder'e basmadan önce: bu kişi izin verdi mi? | İzin takibi dağınık: Email + SMS kampanya oluşturucu ile çözüm | Brief'teki acı noktası "İzin takibi dağınık", doğrulanmış özellik "Email + SMS kampanya oluşturucu" ile eşleşiyor. |
| 6 | 69 | Mini demo |  | 20 saniyede: Davranışsal segmentler. | Mini demo: Davranışsal segmentler (örnek veri) | Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle. |
| 7 | 69 | Mini demo |  | 20 saniyede: Kanal bağımsız otomasyon akışları. | Mini demo: Kanal bağımsız otomasyon akışları (örnek veri) | Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle. |
| 8 | 69 | Mini demo |  | 20 saniyede: Email + SMS kampanya oluşturucu. | Mini demo: Email + SMS kampanya oluşturucu (örnek veri) | Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle. |
| 9 | 69 | Mini demo |  | 20 saniyede: Customer 360 profili. | Mini demo: Customer 360 profili (örnek veri) | Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle. |
| 10 | 69 | Mini demo |  | 20 saniyede: Şablonlar ve izinli formlar. | Mini demo: Şablonlar ve izinli formlar (örnek veri) | Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle. |
| 11 | 68 | İpucu |  | Önce 'İlk kez alanlar' segmentini ayır. | İpucu: Önce 'İlk kez alanlar' segmentini ayır; ikinci siparişe giden yol oradan başlar. | Doğrulanmış özellik "Davranışsal segmentler" için uygulanabilir tek ipucu. |
| 12 | 68 | İpucu |  | Terk edilmiş sepet akışına 'Satın alma kontrolü' ekle. | İpucu: Terk edilmiş sepet akışına 'Satın alma kontrolü' ekle; zaten alan kişiye hatırlatma gitmesin. | Doğrulanmış özellik "Kanal bağımsız otomasyon akışları" için uygulanabilir tek ipucu. |
| 13 | 68 | İpucu |  | Göndermeden önce onaylı alıcı sayısına bak. | İpucu: Göndermeden önce onaylı alıcı sayısına bak; izin yoksa o kişiye ileti gitmez. | Doğrulanmış özellik "Email + SMS kampanya oluşturucu" için uygulanabilir tek ipucu. |
| 14 | 68 | İpucu |  | Kampanyadan önce bir müşterinin zaman çizelgesine bak. | İpucu: Kampanyadan önce bir müşterinin zaman çizelgesine bak; segmenti o zaman daha iyi anlarsın. | Doğrulanmış özellik "Customer 360 profili" için uygulanabilir tek ipucu. |
| 15 | 68 | İpucu |  | Pazarlama izni kutusunu önceden işaretleme. | İpucu: Pazarlama izni kutusunu önceden işaretleme; izin, kişinin kendi tıkıdır. | Doğrulanmış özellik "Şablonlar ve izinli formlar" için uygulanabilir tek ipucu. |
| 16 | 67 | Önce/sonra |  | Önce: ikinci alışveriş gelmiyor. Sonra? | Önce/sonra: İkinci alışveriş gelmiyor → Davranışsal segmentler | Aynı acı noktası süreç farkı olarak anlatılır; sonuç rakamı verilmez. |
| 17 | 67 | Önce/sonra |  | Önce: herkese aynı toplu mail. Sonra? | Önce/sonra: Herkese aynı toplu mail → Davranışsal segmentler | Aynı acı noktası süreç farkı olarak anlatılır; sonuç rakamı verilmez. |
| 18 | 67 | Önce/sonra | ✓ | Önce: terk edilmiş sepet. Sonra? | Önce/sonra: Terk edilmiş sepet → Kanal bağımsız otomasyon akışları | Aynı acı noktası süreç farkı olarak anlatılır; sonuç rakamı verilmez. [Keşif fikri: az denenen tür, sonuçtan öğrenmek için.] |
| 19 | 66 | Mit çürütme | ✓ | "Daha çok e-posta, daha çok satış demektir." Gerçekten mi? | Mit: Daha çok e-posta, daha çok satış demektir. | Brief'teki mit; düzeltme: Önemli olan sayı değil, doğru kişiye doğru zamanda gitmesi. Segment bunun için var. [Keşif fikri: az denenen tür, sonuçtan öğrenmek için.] |
| 20 | 66 | Mit çürütme | ✓ | "Retention sadece büyük markaların işi." Gerçekten mi? | Mit: Retention sadece büyük markaların işi. | Brief'teki mit; düzeltme: Küçük markada her tekrar eden müşteri daha da değerli; tek bir akışla başlanabilir. [Keşif fikri: az denenen tür, sonuçtan öğrenmek için.] |
