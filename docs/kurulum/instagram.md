# Instagram Bağlantısı — Ekran Ekran Kurulum

Yöntem: **Instagram API with Instagram Login** (Facebook Sayfası gerekmez).
Şifrenizi kimseyle (benimle de) paylaşmayın: bağlantı, paneldeki **"Instagram'ı bağla"** butonuyla Instagram'ın kendi giriş ekranında yapılır.

> Meta menü adlarını sık değiştirir. Bir ad tutmazsa en yakın benzerini seçin veya ekran görüntüsü atın.

## Adım 1 — Instagram hesabını profesyonel yap (telefonda)
1. Instagram → Profil → sağ üst **☰** → **Ayarlar ve hareketler**.
2. **Hesap türü ve araçlar** → **Profesyonel hesaba geç**.
3. **İşletme** (Business) veya **İçerik üreticisi** (Creator) seçin. İkisi de çalışır; marka hesabı için **İşletme** önerilir.

## Adım 2 — Meta Developer hesabı
1. Bilgisayardan https://developers.facebook.com adresine gidin, Facebook hesabınızla giriş yapın.
2. Sağ üstte **Başlayın / Get Started** → telefon veya e-posta doğrulaması → rol olarak **Developer** seçin.

## Adım 3 — Uygulama oluştur
1. **My Apps / Uygulamalarım** → **Create App / Uygulama Oluştur**.
2. Kullanım durumu: **"Instagram'da mesaj ve içerik yönetimi"** (Manage messaging & content on Instagram).
3. Uygulama adı: örn. `content-machine` (adda "Instagram" kelimesi kullanmayın; Meta reddeder).
4. İşletme portföyü sorulursa: **"Şimdilik bağlama"** seçebilirsiniz.
5. **Oluştur** → Facebook şifrenizi tekrar isteyebilir.

## Adım 4 — Instagram Login ayarları
1. Sol menü: **Use cases / Kullanım durumları** → Instagram satırında **Customize / Özelleştir**.
2. **API setup with Instagram login** sayfasını açın.
3. Sayfanın üstünde **Instagram app ID** ve **Instagram app secret** görünür. Bunlar Facebook App ID'den **farklıdır**. Şimdilik sadece nerede olduklarını not edin; ADIM 9'da Vercel'e nasıl ekleyeceğinizi anlatacağım. **Sohbete yapıştırmayın.**
4. **"Set up Instagram business login"** bölümü → **Business login settings**:
   - **OAuth redirect URI**: Panel yayına alınınca size vereceğim adres (örn. `https://<panel-adı>.vercel.app/api/instagram/callback`).
   - Kaydedin.
5. Webhooks bölümünü atlayın (gerekmiyor).

## Adım 5 — İzinler
**Permissions and features** listesinde aşağıdakilerin **Standard Access** durumunda olduğunu görün (varsayılan budur, bir şey yapmanız gerekmez):
- `instagram_business_basic`
- `instagram_business_content_publish`
- `instagram_business_manage_insights`

Başka izin eklemeyin.

## Adım 6 — Rol: Instagram Tester
Uygulama **Development** modunda kalacak. Bu modda yalnızca uygulamada rolü olan Instagram hesapları bağlanabilir.
1. Sol menü: **App roles / Uygulama rolleri** → **Roles** → **Add People / Kişi ekle** → **Instagram Tester**.
2. Instagram kullanıcı adınızı yazın → **Gönder**.
3. Daveti kabul edin: bilgisayardan https://www.instagram.com → **Ayarlar** → **Uygulamalar ve web siteleri** → **Test kullanıcısı davetleri** (Tester invites) → **Kabul et**.

## Adım 7 — İnceleme gerekiyor mu?
- **App Review: Gerekmez.** Uygulama sadece sizin hesabınız için; Standard Access yeterli.
- **İşletme doğrulaması: Gerekmez.** Uygulamayı "Live" moda almıyoruz.
- Başka kişilerin hesaplarını bağlamak isterseniz (şu an kapsam dışı) Advanced Access + App Review gerekir.

## Adım 8 — Panelden bağlan (ADIM 9'dan sonra)
1. Panel → **Ayarlar** → **Instagram'ı bağla**.
2. Instagram'ın kendi ekranında giriş yapıp izinleri onaylayın.
3. Panelde **Bağlı · @kullanıcıadı · Token bitişi: gg.aa.yyyy** görünür.
4. Token 60 gün geçerlidir; sistem haftada bir otomatik yeniler. Yenileme başarısız olursa bitişe 7 gün kala Telegram/e-posta ile uyarılırsınız ve aynı butona tekrar basmanız yeterli olur.

## Sık hatalar
| Hata | Çözüm |
|---|---|
| "Invalid redirect_uri" | Adım 4'teki adres paneldeki adresle birebir aynı olmalı (sonda `/` farkı dahil). |
| "Insufficient developer role" | Adım 6'daki daveti kabul etmemişsiniz. |
| Hesap bağlanıyor ama yayın hatası | Hesap profesyonel değil (Adım 1). |
| Metrikler boş | Meta verisi 48 saate kadar gecikebilir; 100 takipçi altında bazı metrikler hiç gelmez. |

Kaynaklar: [Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login) · [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing) · [Insights](https://developers.facebook.com/docs/instagram-platform/insights) · [Token yenileme](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token) · [App Review](https://developers.facebook.com/docs/instagram-platform/app-review)
