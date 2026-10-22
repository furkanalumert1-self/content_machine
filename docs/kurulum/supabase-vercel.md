# Kurulum — Supabase (veritabanı) + Vercel (panel)

Sıra önemli. Toplam ~30–45 dk. Gizli değerleri **sohbete yazmayın**; yalnızca ilgili sitenin ayar ekranına yapıştırın.

**Genel sıra:** 1) Supabase → 2) Vercel → 3) [Instagram/Meta](instagram.md) → 4) [Telegram](telegram.md) → 5) [GitHub Secrets ve açma anahtarı](github-actions.md) → 6) İlk çalıştırma (bu sayfanın sonu).

---

## 1. Supabase

### 1.1 Proje
1. https://supabase.com → **Start your project** → GitHub ile giriş.
2. **New project** → Ad: `content-machine` · Region: **Central EU (Frankfurt)** (Türkiye'ye en yakın) · **Database password**: güçlü bir şifre üretin ve şifre yöneticinize kaydedin (sisteme lazım değil).
3. **Create new project** → ~2 dk bekleyin.

### 1.2 Veritabanı tablolarını kurun (tek seferde)
1. Sol menü → **SQL Editor** → **New query**.
2. GitHub'da [`supabase/kurulum.sql`](../../supabase/kurulum.sql) dosyasını açın → sağ üstte **Copy raw file** (kopyala simgesi) → SQL Editor'e yapıştırın → **Run**.
3. Altta **KURULUM TAMAM** yazısını görmelisiniz. Hata çıkarsa hiçbir değişiklik kaydedilmez; hata mesajını (şifre içermez) bana iletin.
4. Supabase "destructive operation" / "RLS" uyarısı gösterirse **Run this query** ile onaylayın (dosya yalnızca bu projenin tablolarını oluşturur).

> Bu dosya `supabase/migrations/` içindeki 5 dosyanın birleşimidir; testlerde de aynısı çalıştırılır. Bir kez çalıştırmanız yeterli; ikinci kez çalıştırırsanız "already exists" hatası verir ve hiçbir şey değişmez.

### 1.3 Giriş ayarları (yalnızca siz; e-posta + şifre)
1. Sol menü → **Authentication** → **Sign In / Providers**:
   - **Allow new users to sign up** → **KAPALI** (herkese açık kayıt yok).
   - **Email** sağlayıcısı → **AÇIK** kalmalı (kapatırsanız e-posta + şifreyle giriş de kapanır).
2. **Authentication** → **Users** → **Add user** → **Create new user**:
   - **Email**: kendi e-postanız · **Password**: şifre yöneticinizin ürettiği **en az 16 karakterlik** rastgele bir şifre (başka yerde kullanmadığınız) · **Auto Confirm User** işaretli → **Create user**.
   - Şifreyi sohbete veya koda yazmayın; yalnızca bu ekrana ve panel giriş sayfasına girin.
3. **SQL Editor** → yeni sorgu (e-postayı kendi adresinizle değiştirin) → **Run**, sonra `select email from admins;` ile e-postanızın göründüğünü kontrol edin:
   ```sql
   insert into admins (user_id, email)
   select id, email from auth.users where email = 'sizin@eposta.com';
   ```

> **Hesabınızı şifresiz açtıysanız / şifreyi unuttuysanız:** Users listesinde hesabınızın satırı → **⋯** → **Delete user** → adım 2 ve 3'ü yeniden yapın (silme, yönetici kaydını da siler; videolar ve ayarlar etkilenmez).
> Supabase art arda yanlış denemeleri sınırlar; yine de şifrenin uzun ve rastgele olması asıl korumadır.

### 1.4 Anahtarları not edin (bir sonraki adımda yapıştıracaksınız)
**Project Settings** → **API Keys**:
- **Publishable key** (`sb_publishable_…`) → Vercel'de `NEXT_PUBLIC_SUPABASE_ANON_KEY` (tarayıcıda görünmesi sorun değildir; veriyi RLS korur).
- **Secret key** (`sb_secret_…`) → Vercel'de ve GitHub'da `SUPABASE_SERVICE_ROLE_KEY`. **Gizli**: kimseyle paylaşmayın.

**Project Settings** → **Data API** → **Project URL** (`https://xxxx.supabase.co`) → Vercel'de `NEXT_PUBLIC_SUPABASE_URL`, GitHub'da `SUPABASE_URL`.

---

## 2. Vercel (panel)

> ⚠️ **Plan uyarısı:** Vercel'in ücretsiz **Hobby** planı yalnızca **ticari olmayan kişisel kullanım** içindir; Vercel, bir ürünün tanıtımına hizmet eden projeleri ticari sayabilir. Bu panel Callypso Engage'in tanıtım içeriğini yönettiği için gri alandadır. Seçenekler: (a) Hobby ile başlamak (risk sizde), (b) **Pro** plan (aylık ücretli), (c) panel için başka bir barındırma. Ücretli plan sizin onayınız olmadan açılmadı.

### 2.1 Projeyi içe aktarın
1. https://vercel.com → GitHub ile giriş → **Add New…** → **Project**.
2. `content_machine` reposunu seçin → **Import**.
3. **Root Directory** → **Edit** → `web` seçin → **Continue**. ("Include files outside the root directory" seçeneği **açık** kalmalı: panel, `engine/` klasöründeki kuralları kullanır.)
4. Framework: **Next.js** (otomatik). Diğer ayarlara dokunmayın.

### 2.2 Ortam değişkenleri (Environment Variables)
Aynı ekranda **Environment Variables** bölümüne (veya sonradan **Settings → Environment Variables**) tek tek ekleyin:

| Ad | Değer | Gizli mi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 1.4 Project URL | Hayır |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1.4 Publishable key | Hayır |
| `SUPABASE_SERVICE_ROLE_KEY` | 1.4 Secret key | **Evet** |
| `ADMIN_EMAIL` | Kendi e-postanız (1.3'teki) | Hayır |
| `TOKEN_ENCRYPTION_KEY` | [Instagram rehberi Adım 10](instagram.md) ile üretin; GitHub'daki ile **aynı** | **Evet** |
| `INSTAGRAM_APP_ID` | Meta → Instagram app ID | Hayır |
| `INSTAGRAM_APP_SECRET` | Meta → Instagram app secret | **Evet** |
| `INSTAGRAM_REDIRECT_URI` | `https://PANEL-ADINIZ.vercel.app/api/instagram/callback` | Hayır |
| `GH_DISPATCH_TOKEN` | 2.5'te oluşturacağınız GitHub token'ı | **Evet** |
| `GH_AUTOMATION_REPO` | `furkanalumert1-self/content_machine` | Hayır |
| `VERCEL_TOKEN` (isteğe bağlı) | 2.6 | **Evet** |
| `GH_PRODUCT_READ_TOKEN` (isteğe bağlı) | Yalnızca ürün reposu özelse | **Evet** |

Instagram değerleri henüz yoksa boş geçin; panel bunu Ayarlar'da "Yok" olarak gösterir, sonra ekleyip yeniden dağıtırsınız.

### 2.3 Dağıtın
**Deploy** → bitince **Visit**. Adres `https://….vercel.app` biçimindedir; bu sizin **panel adresiniz**.

### 2.4 Adresi her yere yazın
- Vercel → `INSTAGRAM_REDIRECT_URI` → `https://PANEL-ADRESİNİZ/api/instagram/callback`.
- Meta → [Instagram rehberi Adım 4](instagram.md) → OAuth redirect URI (aynı adres, birebir).
- Değişken değiştirdikten sonra: Vercel → **Deployments** → son dağıtım → **⋯** → **Redeploy**.

### 2.5 GitHub tetikleme token'ı ("Hemen üret", "Fikir araştır" butonları)
1. GitHub → sağ üst profil → **Settings** → en alt **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Ad: `content-machine-panel` · Expiration: **1 yıl** (takviminize hatırlatma koyun).
3. **Repository access** → **Only select repositories** → yalnızca `content_machine`.
4. **Permissions** → **Repository permissions** → **Actions: Read and write**. (Metadata: Read otomatik gelir.) Başka hiçbir izin vermeyin.
5. **Generate token** → kopyalayın → Vercel'de `GH_DISPATCH_TOKEN`. Bu token ürün repolarınıza erişemez.

### 2.6 (İsteğe bağlı) Vercel salt okunur bilgi
Ürünler sayfasında son deployment'ı görmek için: Vercel → **Account Settings** → **Tokens** → **Create** → kapsam: hesabınız · süre: 1 yıl → Vercel'de `VERCEL_TOKEN`. Not: Vercel token'ları salt okunur kısıtlanamaz; panel yalnızca okuma isteği yapar.

---

## 3. İlk çalıştırma
1. Panel adresinize gidin → e-postanızı ve şifrenizi yazın → **Giriş yap** → **Kuyruk** açılır.
2. GitHub → **Settings → Secrets and variables → Actions → Variables** → `AUTOMATION_ENABLED` = `true` ([ayrıntı](github-actions.md)).
3. GitHub → **Actions** → **Fikir araştırması** → **Run workflow** (ilk fikirler; brief dosyadan bir kez yüklenir ve ürün aktifleşir).
4. GitHub → **Actions** → **Günlük plan ve render** → **Run workflow** → ~3 dk sonra panelde **Kuyruk**'ta video "Onay bekliyor" görünür; Telegram kuruluysa önizleme oraya da gelir.
5. Panel → **Ayarlar** → **Instagram'ı bağla** → Instagram ekranında izinleri onaylayın → "Bağlı · @hesabınız".
6. Videoyu izleyin → **Onayla** → planlanan saatten sonraki ilk yayın kontrolünde paylaşılır.

## Sorun giderme
| Belirti | Çözüm |
|---|---|
| "E-posta veya şifre hatalı" | Vercel'deki `ADMIN_EMAIL` girdiğiniz e-postayla aynı mı? Şifreyi unuttuysanız 1.3'teki notla hesabı yeniden oluşturun. |
| "Bu hesap yönetici olarak tanımlı değil" | 1.3 adım 3'teki SQL'i kendi e-postanızla çalıştırın. |
| "Çok fazla deneme yapıldı" | Birkaç dakika bekleyin (Supabase güvenlik sınırı). |
| "Eksik ortam değişkeni: …" | Vercel'de o adı ekleyip **Redeploy**. |
| "GitHub tetikleme yapılandırılmamış" | `GH_DISPATCH_TOKEN` ve `GH_AUTOMATION_REPO` ekleyin; iş yine de zamanında (08:41) çalışır. |
| "GitHub işi başlatılamadı (HTTP 403/404)" | Token yalnızca `content_machine` için ve **Actions: Read and write** olmalı. |
| Kuyrukta video yok | `AUTOMATION_ENABLED=true` mi? GitHub → Actions → "Günlük plan ve render" logu. |
