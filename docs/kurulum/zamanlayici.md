# Zamanlayıcı — işleri Supabase'den dakikasında başlatma

**Neden:** GitHub'ın zamanlanmış işleri yoğunlukta gecikiyor ya da hiç başlamıyor (26.10'da yayın kontrolü günde 28 yerine 2–3 kez çalıştı; video 20:00 yerine elle 20:09'da paylaşıldı). Supabase'in zamanlayıcısı (pg_cron) işleri dakikasında başlatır; işin kendisi yine GitHub Actions'ta çalışır. GitHub'ın kendi zamanlaması yedek olarak kalır; aynı iş iki kez başlasa bile video bir kez planlanır ve bir kez paylaşılır.

| İş | İstanbul saati |
|---|---|
| Günlük plan ve render | Her gün 08:41 |
| Yayın kontrolü | 13:07–15:52 ve 19:07–20:52, 15 dk'da bir |
| Metrikler ve token | Her gün 10:17 |
| Fikir araştırması | Pazartesi 07:23 |

Token'ı **sohbete yazmayın**; yalnızca GitHub, Supabase ve Vercel ekranlarına yapıştırın.

## Adım 1 — GitHub token'ı oluşturun
1. GitHub → sağ üstte profil fotoğrafınız → **Settings**.
2. Sol menüde en altta **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Doldurun:
   - **Token name:** `sepet-rontgeni-zamanlayici`
   - **Expiration:** **Custom** → bugünden 1 yıl sonrası (takviminize bitişten 1 hafta öncesine hatırlatma koyun).
   - **Resource owner:** `furkanalumert1-self`
   - **Repository access:** **Only select repositories** → yalnızca `content_machine`.
   - **Permissions** → **Repository permissions** → **Actions** → **Read and write**. (Metadata: Read kendiliğinden gelir.) Başka hiçbir izin vermeyin.
4. **Generate token** → çıkan `github_pat_…` değerini kopyalayın. Bir daha gösterilmez; şifre yöneticinize de kaydedin.

## Adım 2 — Token'ı Supabase Vault'a ekleyin
Supabase → **SQL Editor** → **New query** → aşağıdakini yapıştırın, `BURAYA_TOKEN` yerine token'ı yazın → **Run**:
```sql
select vault.create_secret('BURAYA_TOKEN', 'github_dispatch_token', 'GitHub Actions tetikleme');
```
Sonuçta uzun bir kimlik (uuid) görürsünüz. Ardından bu sorgu sekmesini **kapatıp silin** (token editör geçmişinde kalmasın).

> Token'ı değiştirmek için (yenilediğinizde):
> ```sql
> select vault.update_secret((select id from vault.secrets where name = 'github_dispatch_token'), 'YENI_TOKEN');
> ```

## Adım 3 — Zamanlayıcıyı kurun
1. GitHub'da `supabase/zamanlayici.sql` dosyasını açın → kopyala simgesi.
2. Supabase → **SQL Editor** → **New query** → yapıştırın → **Run**.
3. Altta 5 satır görmelisiniz: `sr-fikirler`, `sr-gunluk-video`, `sr-metrikler`, `sr-yayin-aksam`, `sr-yayin-ogle`.

> "permission denied to create extension" hatası alırsanız: **Database** → **Extensions** → `pg_cron` ve `pg_net` satırlarını açın (Enable), sonra 2. adımı tekrarlayın.

## Adım 4 — Deneyin
SQL Editor'de çalıştırın (sesli bir şey yayınlamaz; yalnızca "Ses testi" işini başlatır):
```sql
select zamanlayici.gh_dispatch('voice-test.yml');
```
1 dakika içinde GitHub → **Actions** → **Ses testi** altında yeni bir çalışma belirmeli. Yanıtı da görebilirsiniz:
```sql
select status_code, created from net._http_response order by created desc limit 3;
```
`204` = başarılı. `401` = token yanlış/süresi dolmuş. `403`/`404` = token'a `content_machine` için **Actions: Read and write** verilmemiş.

## Adım 5 — Aynı token'ı panele ekleyin (düğmeler için)
Vercel → proje → **Settings** → **Environment Variables** → `GH_DISPATCH_TOKEN` = aynı token → **Save** → **Deployments** → son dağıtım → **⋯** → **Redeploy**. Böylece paneldeki **Yeniden üret**, **Hemen üret**, **Fikir araştır** düğmeleri de çalışır.

## Kontrol ve kapatma
- Son çalışmalar: `select jobname, status, start_time from cron.job_run_details d join cron.job j using (jobid) order by start_time desc limit 10;`
- Tamamen durdurmak: GitHub'da `AUTOMATION_ENABLED` = `false` (işler başlasa da hemen atlanır) veya
  `select cron.unschedule(jobname) from cron.job where jobname like 'sr-%';`
- Yayın saatlerini Ayarlar'dan değiştirirseniz `zamanlayici.sql` ve `.github/workflows/publisher.yml` saatlerini de güncelleyin.
