# Güvenlik ve kontrol — kural nerede, nasıl test ediliyor?

| Kural | Nerede uygulanıyor | Test |
|---|---|---|
| Varsayılan `MODE=approval`; onaysız yayın yok | DB: `claim_due_video()` yalnızca onay özeti içerikle eşleşen videoyu verir · yayından hemen önce tekrar kontrol | DB T5–T7, `instagram.test` |
| `MODE=auto` ilk yayından ≥7 gün sonra ve açık değişiklikle; kim/ne zaman kaydedilir | DB tetikleyici `settings_guard` | DB T15 |
| `PAUSED=true` tüm paylaşımları durdurur; yayından hemen önce tekrar okunur | DB `claim_due_video()` + `publish.ts` son kontrol + publisher başında çıkış | DB T6, `instagram.test` |
| Reddedilen / üretimi başarısız / onaysız video yayınlanmaz | DB `claim_due_video()` | DB T7 |
| İçerik değişince onay düşer (Telegram düğmeleri dahil) | DB `video_update_guard` · imzalı düğme içerik özetine bağlı | DB T5, `approval.test` |
| Yayın sırasında içerik değişemez; mükerrer yayın yok | DB kuralı + container kaydı + belirsizlikte container sorgusu | DB T13, `instagram.test` |
| Yanıltıcı iddia, demo rakamı, rakip adı, fiyat, hukuki garanti, web adresi, kişisel veri (e-posta/telefon) yok | `content/claims.ts` → fikir, senaryo ve caption'da zorunlu | `claims.test`, `approval.test`, `plan.test` |
| Doğrulanmamış özellik anlatılmaz | Brief'teki "Doğrulanmamış" listesi → `mentionsUnverified` | `claims.test`, `plan.test` |
| Gerçek müşteri verisi yok; demo ekranları "örnek veri" etiketli | Görseller kodla çizilir; `sample_data` → ekran rozeti + caption notu | `plan.test` |
| İzinsiz telifli içerik yok; lisans kaynağı kayıtlı | Yalnızca OFL fontlar, kendi çizimimiz, müzik yok · `videos.licenses` | `render.ts` |
| Token/anahtar log ve bildirimlere yazılmaz | `redact.ts` → logger, Telegram, hata mesajları · GitHub Secrets ayrıca `***` | `redact.test`, `approval.test` |
| Instagram token'ı şifreli; panel bile göremez | AES-256-GCM · tabloya yalnızca service role · panel `instagram_status()` | DB T9–T11, `instagram.test` |
| Yetkisiz kullanıcı veri göremez | RLS: yalnızca `admins` tablosundaki hesap | DB T9–T11 |
| Ürün reposunda gizli dosya okunmaz; sızıntı görülürse durur | `sync/github.ts` yasaklı yol listesi + kalıp taraması | `sync.test` |
| Telegram düğmeleri yalnızca sahibin hesabından | `handleUpdate` sahip kimliği kontrolü | `approval.test` |
| Hatalar bildirilir | `log.error(..., { notify: true })` → Telegram; GitHub ayrıca başarısız iş e-postası gönderir | `approval.test` |

**Bilinen sınırlamalar**
- Repo herkese açıkken kod ve iş logları görünür (gizli değerler hariç). Özel yapılması önerilir: [otomasyon rehberi](kurulum/github-actions.md#önerim-repoyu-özel-private-yapın).
- Telegram basışları yayın kontrolü sırasında işlenir (anında değil). Panel (ADIM 9) anında işler.
- Canlı Supabase/Instagram/Telegram ile uçtan uca deneme, hesaplar bağlanınca yapılacak; şu an kurallar birim ve veritabanı testleriyle doğrulandı.
