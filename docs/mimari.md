# Mimari

```
┌──────────── Vercel ────────────┐        ┌────────── GitHub Actions ──────────┐
│ web/ (Next.js, Türkçe panel)   │ dispatch│ planner+render (günde 1)          │
│ - Supabase Auth (tek hesap)    │────────▶│ publisher (11:45–22:45, 15 dk)    │
│ - "Instagram'ı bağla" (OAuth)  │         │ metrics (günde 1)                 │
│ - render YOK                   │         │ idea_research (haftada 1)         │
└──────────────┬─────────────────┘         └───────────────┬───────────────────┘
               │  RLS: sadece admin                         │ service role
               ▼                                            ▼
        ┌──────────────────────── Supabase ─────────────────────────┐
        │ Postgres: products, product_briefs, ideas, videos,        │
        │ publish_attempts, metrics, logs, app_settings,            │
        │ instagram_connection (token: yalnızca service role)       │
        │ Storage: videos/ (Meta'ya imzalı URL ile sunulur)         │
        └───────────────────────────────────────────────────────────┘
```

| Klasör | İçerik |
|---|---|
| `config/products/` | Ürün kimliği (`.json`) ve brief (`.md`) |
| `config/styles/` | Stil kuralları + lisans/kaynak |
| `engine/` | Node.js + Remotion: planner, render, publisher, metrics, idea_research |
| `web/` | Yönetim paneli: Next.js 16 + Tailwind, Türkçe; proxy + DAL + RLS ile yalnızca yönetici |
| `supabase/` | Şema (migrations) ve şema testleri |

## Veritabanında zorlanan kurallar (`supabase/migrations/0001_init.sql`)
- Onaylı brief yoksa ürün aktif olamaz; video oluşturulamaz.
- MVP'de tek aktif ürün (`multi_product_enabled=false`).
- Video yalnızca `ready` durumundan onaylanır; içerik (senaryo, caption, hashtag, dosya) değişirse onay düşer. Saat değişikliği onayı bozmaz.
- `claim_due_video()`: PAUSED açıksa hiçbir şey vermez; video atomik olarak `publishing` durumuna kilitlenir → aynı video iki kez alınamaz. `ig_media_id` tekil.
- Reddedilen, render'ı başarısız ve onaysız video yayına alınmaz (`auto` modda yalnızca kalite kontrolden geçmiş `ready` video).
- Yayınlanmış video geri alınamaz.
- RLS: anonim ve yönetici olmayan kullanıcı hiçbir satır göremez. Instagram token tablosuna panel kullanıcısı bile erişemez; panel yalnızca `instagram_status()` ile token'sız durum görür.
