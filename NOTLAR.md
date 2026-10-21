# Proje Notları (kısa, kalıcı)

## Durum
- 21.10.2026 — ADIM 0 tamamlandı → `docs/adim-0-arastirma.md`.
- 21.10.2026 — Kullanıcı "başla" dedi. ADIM 1 tamamlandı: klasör yapısı, Supabase şeması + RLS, motor temel kütüphaneleri (env, log maskeleme), CI. **ADIM 2 için onay bekleniyor.**

## Kararlar
- Instagram yöntemi: Instagram API with Instagram Login (Facebook Sayfası yok). İzinler: `instagram_business_basic`, `instagram_business_content_publish`, `instagram_business_manage_insights`.
- Gizli değerler sohbette istenmez/alınmaz; kullanıcı izin verdi ama güvenlik için reddedildi. Kullanıcı Vercel env ve GitHub Secrets'a kendisi ekler. Instagram bağlantısı OAuth butonu ile.
- Instagram token'ı veritabanında `TOKEN_ENCRYPTION_KEY` ile şifreli tutulacak (ADIM 5); tabloya yalnızca service role erişir.
- Kullanılmayacaklar: JohnHeibel/PDoomVideo ve joeseesun/opus-video-prompts (lisans yok), Clawd karakteri (marka), pdoom ses dosyası.
- Panel (web/) ADIM 9'da kurulacak; ADIM 1'de sadece yer tutucu.

## Varsayılanlar (kullanıcı cevap vermedi, "başla" dedi — değiştirilebilir)
1. MVP stili: Dark Tech Keynote.
2. Publisher: GitHub Actions, sadece 11:45–22:45 İstanbul (Seçenek A).
3. Ücretli yapay zekâ API'si: KAPALI. Senaryo şablon + kurallarla üretilecek; açmak için açık onay gerekli.
4. Bildirim: Telegram.
5. Müzik: MVP'de yok.

## Bilinen sınırlamalar
- Yerelde root ile `initdb` çalışmaz → şema testleri `runuser -u postgres` ile.
- CI her push'ta ~1–2 Actions dakikası harcar (sadece kod değişince; .md/docs hariç).
