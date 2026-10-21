# Proje Notları (kısa, kalıcı)

## Durum
- 21.10.2026 — ADIM 0 tamamlandı → `docs/adim-0-arastirma.md`. **Uygulamaya geçmek için onay bekleniyor.**
- Instagram kurulum rehberi hazır → `docs/kurulum/instagram.md`.

## Kararlar
- Instagram yöntemi: Instagram API with Instagram Login (Facebook Sayfası yok). İzinler: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`.
- Gizli değerler sohbette istenmez/alınmaz; kullanıcı Vercel env ve GitHub Secrets'a kendisi ekler. Instagram bağlantısı OAuth butonu ile.
- Kullanılmayacaklar: JohnHeibel/PDoomVideo ve joeseesun/opus-video-prompts (lisans yok), Clawd karakteri (marka), pdoom ses dosyası.

## Onay bekleyen sorular
1. MVP stili: Dark Tech Keynote?
2. Publisher: A) Actions, sadece 11:45–22:45 · B) Supabase Cron.
3. Fikir/senaryo için ücretli yapay zekâ API'si (Claude API) kullanılsın mı?
4. Bildirim: Telegram mı e-posta mı?
5. Müzik: MVP'de müziksiz mi, kodla üretilmiş basit ses mi?
