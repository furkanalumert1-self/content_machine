# ADIM 0 — Araştırma Özeti (21.10.2026)

Repolar `git clone --depth 1` ile indirilip yalnızca okundu; hiçbir kodları çalıştırılmadı.

## 1. Repo tablosu

| Repo | Var mı | Lisans | Ne işe yarıyor | Bizim için kullanılabilecek parça |
|---|---|---|---|---|
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | ✅ | MIT (derleyenin kendi metni) | 703 prompt, X'ten derlenmiş video listesi | Sadece **ilham**. Promptların metni paylaşan kişilere ait; MIT bu metinleri kapsamaz, birebir kopyalamayacağız. |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | ✅ | Kod ve dokümanlar MIT; demo filmler CC BY 4.0; üçüncü taraf varlıklar kendi lisanslarıyla | Claude Code skill'i + stil rehberleri (`STYLE.md`) | Stil rehberlerinin "dilbilgisi" (kompozisyon, hareket, ritim kuralları). Kaynak gösterilerek uyarlanabilir. |
| [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video) | ✅ | MIT (kod). Şarkı onların değil. | Kodla üretilmiş müzik klibi (three.js) | Fikir: "her kare zamanın deterministik fonksiyonu" ve ritme oturtulmuş zaman çizelgesi. **Ses dosyası kullanılamaz.** |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | ✅ | **Belirsiz**: LICENSE dosyası yok; `package.json` içinde yalnızca npm'in varsayılan "ISC" alanı var | p5.brush ile klip | **Atlandı.** Lisans dosyası olmadığı için kullanım izni varsaymıyoruz. |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | ✅ | MIT | 15 stil, her biri 10 sn; `renderAt(t)` + headless Chrome + ffmpeg; `rubric.md` ile yapay zekâ jürisi | Kalite kontrol rubriği fikri, deterministik render deseni. |
| [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) | ✅ | MIT | p5.js karakter animasyonu başlangıç kiti | Kendi işini "kontakt sayfası" (kare ızgarası) ile görsel kontrol etme yöntemi. Karakter Anthropic'in Clawd maskotu → **ürün videolarımızda kullanmayacağız** (marka). |
| [athemeroy/awesome-claude-5-5-videos](https://github.com/athemeroy/awesome-claude-5-5-videos) | ✅ | CC BY 4.0 — yalnızca kendi yazıları; görseller/promptlar kapsam dışı (THIRD_PARTY.md) | 424 gönderinin analizi | Sadece araştırma bulguları (okuma amaçlı). |
| [joeseesun/opus-video-prompts](https://github.com/joeseesun/opus-video-prompts) | ✅ | **Yok** | 18 Çince prompt, 54 örnek | **Atlandı** (lisans yok). |

### lemo-opuscar "51 stil" iddiası — doğrulandı
- `styles/` altında `_template` hariç **51 klasör**, her birinde `STYLE.md` var.
- `styleboard/catalog.json` içinde **51 kayıt**.
- 51 klasörün hepsinin `demo/` klasörü dolu.
- Not: Bu stiller 1920×1080 / 24 fps ve canvas/WebGL için yazılmış. Biz 1080×1920 / 30 fps ve Remotion kullanacağız; yani kodu değil kuralları uyarlayacağız.

## 2. SaaS tanıtım videoları için en uygun üç stil

1. **Dark Tech Keynote** (`lemo-opuscar/styles/dark-keynote`): Arayüz başrolde; koyu sahne, ince ızgara, tek marka vurgu rengi, kesin hareketler. Problem→çözüm ve mini demo videoları için uygun. → **MVP için tek stil önerim bu.**
2. **Living Screencast** (`living-screencast`): Ürün arayüzünü kodla yeniden çiziyor, kamera imleci takip ediyor. "Mini demo" için çok iyi. Ama gerçek ekran kaydı gibi göründüğünden demo rakamlarına **"örnek veri"** etiketi koymak zorunlu.
3. **Swiss Motion** (`swiss-motion`): Izgara, tek font, tek sinyal rengi, büyük tipografi. İpucu ve mit çürütme videoları için sade ve okunaklı.

Kaynak gösterme: "Stil kuralları LemoLab / lemo-opuscar'dan (MIT) uyarlanmıştır" notu `config/styles/` içine yazılacak.

## 3. Instagram — resmi "Instagram Login" yöntemi uygun mu? ✅ Evet

Resmi Meta belgelerine göre (21.10.2026'da kontrol edildi):

| Konu | Sonuç |
|---|---|
| Hesap türü | Instagram **profesyonel** hesap (Business veya Creator) |
| Facebook Sayfası | **Gerekmez** |
| Reels yayını | Destekleniyor: `POST /<IG_ID>/media` (`media_type=REELS`, `video_url`) → `GET ?fields=status_code` → `POST /<IG_ID>/media_publish`. Host: `graph.instagram.com` |
| Video URL | Meta'nın erişebildiği **herkese açık URL** şart (dosyadan yükleme yalnızca Facebook Login'de). Supabase Storage imzalı URL (24 sa) kullanılacak. |
| İzinler (Instagram Login) | `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights` |
| Promptta yazan izinler | `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `instagram_manage_insights` **Facebook Login yöntemine aittir**. Instagram Login'de bunları istemiyoruz. |
| Reels metrikleri | `views`, `likes`, `saved`, `shares`, `comments`, `reach`, `total_interactions`, `ig_reels_avg_watch_time` mevcut. (`views` ve `total_interactions` Meta'da "geliştirme aşamasında" diye işaretli.) `impressions` 2 Temmuz 2024 sonrası medyada yok. |
| Metrik gecikmesi | Veri **48 saate kadar** gecikebilir. → 24. saatte alıp 72. saatte tekrar güncelleyeceğiz; olmayan veri boş bırakılacak, uydurulmayacak. |
| Takipçi aktif saatleri | `online_followers`: **100 takipçi altında yok**, sadece son 30 gün. Az takipçide keşif modunda saat denemesi yapılacak. |
| Token | Kısa ömürlü 1 saat → uzun ömürlü **60 gün**. Uzun ömürlü token **en az 24 saatlik olup süresi dolmamışsa** yenilenebilir (yeniden 60 gün). → Haftalık otomatik yenileme + bitişe 7 gün kala uyarı. Gerçek süre her seferinde API'nin `expires_in` değerinden kaydedilecek. |
| Uygulama incelemesi (App Review) | Sadece **kendi hesabınız** için kullanılan uygulamada **gerekmez** (Standard Access yeterli). Uygulama "Development" modunda kalabilir; şirket doğrulaması gerekmez. |
| Rol şartı | Development modunda yalnızca uygulamada rolü olan hesaplar bağlanabilir → Instagram hesabınız **Instagram Tester** olarak eklenmeli ve davet kabul edilmeli. |
| Yayın limiti | 24 saatte 100 API gönderisi (belgenin bir yerinde 50 yazıyor; tutarsız). Biz günde 1 paylaşıyoruz; yine de her yayından önce `content_publishing_limit` kontrol edilecek. |
| Container ömrü | 24 saat içinde yayınlanmazsa `EXPIRED`. |
| Video teknik şartları | Resmi sayfa bu oturumda açılamadı (404). Üçüncü taraf kaynaklara göre MP4, H.264, AAC, 9:16, 23–60 fps, 3 sn–15 dk. Bizim 1080×1920/30 fps/15–45 sn çıktımız bunların içinde kalıyor; uygulama adımında resmi sayfadan tekrar doğrulanacak. |

Kurulum rehberi: [`docs/kurulum/instagram.md`](kurulum/instagram.md)

## 4. GitHub Actions maliyeti ve risk

- Private repo, GitHub Free: **ayda 2.000 dakika**. Public repo standart runner: ücretsiz. Ödeme yöntemi yoksa kota bitince işler durur (fatura çıkmaz).
- Her iş en az 1 dakika sayılır. **15 dakikada bir publisher = günde 96 çalışma ≈ ayda ~2.900 dakika → tek başına kotayı aşar.**
- Tahmin (önerilen çözümle): render ~6–10 dk/gün (~250 dk/ay) + metrik ~30 + araştırma ~20 + publisher.
- Çözüm seçenekleri (kararınız gerekli):
  - **A (önerim):** Publisher yalnızca yayın penceresinde çalışsın: İstanbul 11:45–22:45 arası 15 dakikada bir (~45 çalışma/gün ≈ 1.350 dk/ay). Toplam ≈ **1.650–1.750 dk/ay** — sınıra yakın ama altında.
  - **B:** Publisher'ı Supabase Cron + Edge Function'a taşı (ücretsiz katman, sadece birkaç HTTP çağrısı; render değil). Actions dakikası neredeyse sıfıra iner.
- GitHub zamanlanmış işleri birkaç dakika (yoğunlukta daha fazla) gecikebilir; kesin dakika garantisi yok.

## 5. Claude Code zamanlanmış görevleri ile karşılaştırma

| | GitHub Actions | Claude Code zamanlanmış görev |
|---|---|---|
| Davranış | Her seferinde aynı kod, tekrarlanabilir | Her seferinde bir yapay zekâ oturumu; sonuç değişebilir |
| Maliyet | Kota içinde ücretsiz | Claude kullanım hakkından yer |
| Gizli anahtarlar | GitHub Secrets | Oturum ortamına vermek gerekir |
| Bu iş için | ✅ **Uygun** | Haftalık fikir araştırmasında yardımcı olabilir, yayın için uygun değil |

## 6. Varsayımlar / engeller
- Meta panelindeki menü adları sık değişiyor; rehberdeki adlar 10/2026 belgelerine göre.
- Vercel API token'ları "salt okunur" kapsamla verilemiyor (takım düzeyinde yetki). Ayrı bir takım/hesap veya sadece belirli projeye erişim gerekebilir; uygulama adımında doğrulanacak.
- Fikir ve senaryo üretimi için bir yapay zekâ API'si gerekiyor (ücretli). Onayınız olmadan etkinleştirilmeyecek.
