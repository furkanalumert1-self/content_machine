# Otomasyon — GitHub Actions (bilgisayarınız kapalıyken de çalışır)

## Ne, ne zaman çalışır? (İstanbul saati)
| İş | Zaman | Ne yapar | Tahmini süre |
|---|---|---|---|
| **Günlük plan ve render** (`daily.yml`) | Her gün 08:41 | Brief senkronu → fikir + senaryo + yayın saati → video üretimi → kalite kontrolü → depolama. Fikir azsa aynı çalışmada acil fikir araştırması. | ~3 dk |
| **Yayın kontrolü** (`publisher.yml`) | 12:07–14:52 ve 19:07–22:52 arası 15 dk'da bir | Telegram onay/ret basışlarını uygular, zamanı gelmiş onaylı videoyu Instagram'a gönderir | ~1 dk (yayın varsa 2–6 dk) |
| **Metrikler ve token** (`metrics.yml`) | Her gün 10:17 | Token yenileme/uyarı, 24. ve 72. saat metrikleri, takipçi aktif saatleri | ~1 dk |
| **Fikir araştırması** (`ideas.yml`) | Pazartesi 07:23 | 15–20 yeni fikir | ~1 dk |
| **Render deneme** (`render-test.yml`) | Elle veya render kodu değişince | Gizli anahtarsız örnek video (artifact olarak indirilebilir) | ~1,5 dk |
| **Testler** (`ci.yml`) | Kod değişince | Testler | ~1 dk |

Dakikalar :00 yerine :07, :17, :41 gibi seçildi: GitHub saat başlarında yoğunlaşır ve o anlarda işleri geciktirebilir, hatta düşürebilir.

> **Gecikme uyarısı:** GitHub zamanlanmış işleri yoğunlukta birkaç dakika (bazen daha fazla) geciktirebilir; kesin dakika garantisi yoktur. Onayladığınız video, seçilen saatten sonraki **ilk başarılı yayın kontrolünde** paylaşılır. Onayı yayın aralığından sonra verirseniz video bir sonraki aralıkta (ertesi gün 12:07'den itibaren) gider.

## Açma anahtarı: `AUTOMATION_ENABLED`
Zamanlanmış işler, siz bu değişkeni `true` yapana kadar **atlanır** (dakika harcamaz, hata e-postası gelmez). Önce gizli anahtarları ekleyin, Supabase ve Instagram'ı bağlayın, en son bunu açın.

1. GitHub → `content_machine` reposu → **Settings**
2. Sol menü → **Secrets and variables** → **Actions**
3. **Variables** sekmesi → **New repository variable**
4. Name: `AUTOMATION_ENABLED` · Value: `true` → **Add variable**

Durdurmak için değeri `false` yapın (veya paneldeki **PAUSED**'ı açın: işler çalışır ama hiçbir şey yayınlanmaz).

## Gizli anahtarlar (Secrets) — ekran ekran
Değerleri **sohbete yazmayın**; yalnızca GitHub'a yapıştırın. GitHub bunları loglarda `***` olarak gizler; ayrıca kodumuz da maskeleme yapar.

1. GitHub → `content_machine` → **Settings** → **Secrets and variables** → **Actions**
2. **Secrets** sekmesi → **New repository secret**
3. Name ve Secret alanlarını doldurun → **Add secret**. Her satır için tekrarlayın:

| Name | Nereden | Zorunlu mu |
|---|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → **Data API** → Project URL | Evet |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → **API Keys** → `service_role` (gizli) | Evet |
| `TOKEN_ENCRYPTION_KEY` | [Instagram rehberi](instagram.md#adım-10--gizli-anahtarlar-siz-eklersiniz-sohbete-yapıştırmayın) — Vercel'dekiyle **aynı** değer | Evet |
| `GH_PRODUCT_READ_TOKEN` | Ürün reposu özelse: GitHub → Settings → Developer settings → **Fine-grained tokens** → yalnızca o repo, **Contents: Read**, **Metadata: Read** | Hayır (Callypso reposu herkese açık) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | [Telegram rehberi](telegram.md) | Önerilir (onay düğmeleri ve hata bildirimleri) |

## Elle çalıştırma
GitHub → **Actions** → soldan iş (ör. "Günlük plan ve render") → **Run workflow** → **Run workflow**. Panel butonları (ADIM 9) aynı şeyi sizin yerinize yapar.

## Tekrar çalıştırma ve mükerrer yayın
- Günlük iş aynı gün tekrar çalışırsa ikinci bir video planlamaz.
- Render yalnızca bekleyen videoları alır; takılı kalanları 30 dk sonra yeniden dener (en fazla 3 deneme).
- Yayın: veritabanı kilidi + Instagram container kontrolü → aynı video iki kez paylaşılmaz (yayın işi yarıda kesilse bile).
- Aynı iş üst üste binmez (`concurrency`).

## Maliyet
**Şu an repo herkese açık (public)** → GitHub'ın standart makineleri **ücretsiz**, dakika sınırı yok.

Repo **özel (private)** yapılırsa GitHub Free'de **ayda 2.000 dakika** dahildir. Her iş en az 1 dakika sayılır. Tahmin (render süresi GitHub makinesinde **ölçüldü**: 21 sn'lik video 40,7 sn'de üretildi, iş toplam 1,5 dk — 21.10.2026):

| İş | Hesap | Dakika/ay |
|---|---|---|
| Yayın kontrolü | 28 çalışma/gün × 1 dk × 30 | ~840 |
| Günlük plan + render | ~3 dk × 30 | ~90 |
| Metrikler | 1 dk × 30 | ~30 |
| Fikir araştırması | 1 dk × 4 | ~4 |
| Testler (kod değiştikçe) | | ~30–60 |
| **Toplam** | | **~1.000 (kotanın ~%50'si)** |

Ödeme yöntemi tanımlı değilse kota bitince işler durur, **fatura çıkmaz**. Ücretli hiçbir şey açılmadı.

## Önerim: repoyu özel (private) yapın
Herkese açık repoda iki risk var:
1. **Görünürlük:** kod, brief ve **iş logları** (planlanan fikir, hata mesajları) herkese açıktır. Gizli değerler loglara yazılmaz, ama iş bilgileri görünür.
2. **60 gün kuralı:** GitHub, herkese açık repolarda 60 gün commit olmazsa zamanlanmış işleri **otomatik kapatır**. Sistem kendi başına commit atmaz, yani bir gün otomasyon sessizce durabilir.

Özel yapmak için: **Settings** → en altta **Danger Zone** → **Change visibility** → **Make private**. Tahmini kullanım kotanın içinde kalır.

## Neden Claude Code zamanlanmış görevleri değil?
| | GitHub Actions | Claude Code zamanlanmış görev |
|---|---|---|
| Davranış | Her seferinde aynı kod; sonuç tekrarlanabilir | Her seferinde bir yapay zekâ oturumu; sonuç değişebilir |
| Maliyet | Public: ücretsiz · Private: aylık kota içinde | Claude kullanım hakkından harcar |
| Gizli anahtarlar | GitHub Secrets (loglarda gizli) | Oturum ortamına verilmesi gerekir |
| Yayın güvenliği | Kilitler ve kurallar kodda, testli | Yapay zekânın her seferinde aynı kurala uyması gerekir |

**Karar:** Render, yayın ve metrik gibi düzenli işler GitHub Actions'ta. Claude Code ileride yalnızca isteğe bağlı işler için (ör. yeni ürün brief taslağı) düşünülebilir.
