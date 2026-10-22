import { ActionForm } from '@/components/action-form';
import { Badge, Card, Field, Input, Notice, PageHeader } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { integrationStatus } from '@/lib/env';
import { fmtDateTime } from '@/lib/format';
import { disconnectInstagram, setMode, setPaused, setSchedule } from './actions';

const IG_MSG: Record<string, [string, 'ok' | 'error' | 'warn']> = {
  baglandi: ['Instagram bağlandı.', 'ok'],
  iptal: ['Instagram izni verilmedi.', 'warn'],
  durum: ['Güvenlik kontrolü başarısız (state). Tekrar deneyin.', 'error'],
  izin: ['Gerekli izinlerin hepsi verilmedi. Tekrar bağlanıp tüm izinleri onaylayın.', 'error'],
  hata: ['Instagram bağlantısı kurulamadı. Kurulum rehberini kontrol edin.', 'error'],
  ayar: ['Instagram ayarları (Vercel ortam değişkenleri) eksik.', 'error'],
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ instagram?: string }> }) {
  const { instagram } = await searchParams;
  const { db } = await requireAdminPage();
  const [{ data: s }, { data: ig }] = await Promise.all([
    db.from('app_settings').select('*').single(),
    db.rpc('instagram_status').maybeSingle<{ connected: boolean; username: string | null; token_expires_at: string | null; last_refreshed_at: string | null; scopes: string[] | null }>(),
  ]);
  const env = integrationStatus();
  const windows = (s?.publish_windows ?? []) as { start: string; end: string }[];
  const daysLeft = ig?.token_expires_at ? Math.floor((new Date(ig.token_expires_at).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <>
      <PageHeader title="Ayarlar" description="Yayın modu, durdurma, saat aralıkları ve Instagram bağlantısı." />
      {instagram && IG_MSG[instagram] && <div className="mb-4"><Notice tone={IG_MSG[instagram][1]}>{IG_MSG[instagram][0]}</Notice></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Yayını durdur (PAUSED)" aside={s?.paused ? <Badge tone="red">Durduruldu</Badge> : <Badge tone="green">Açık</Badge>}>
          <p className="mb-3 text-sm text-muted">Açıkken hiçbir video yayınlanmaz. Yayından hemen önce tekrar kontrol edilir. Üretim ve planlama devam eder.</p>
          {s?.paused
            ? <ActionForm action={setPaused} label="Yayını yeniden aç" variant="success" hidden={{ paused: 'false' }} />
            : <ActionForm action={setPaused} label="Tüm yayınları durdur" variant="danger" hidden={{ paused: 'true' }} confirm="Tüm yayınlar durdurulsun mu?" />}
        </Card>

        <Card title="Yayın modu" aside={<Badge tone={s?.mode === 'auto' ? 'amber' : 'green'}>{s?.mode === 'auto' ? 'Otomatik' : 'Onaylı'}</Badge>}>
          <p className="mb-3 text-sm text-muted">Onaylı mod: yalnızca onayladığınız videolar yayınlanır (önerilen). Otomatik mod: kalite kontrolünden geçen her video onaysız yayınlanır; ilk yayından en az 7 gün sonra açılabilir.</p>
          {s?.mode === 'auto'
            ? <ActionForm action={setMode} label="Onaylı moda dön" variant="success" hidden={{ mode: 'approval' }} />
            : (
              <ActionForm action={setMode} label="Otomatik modu aç" variant="danger" hidden={{ mode: 'auto' }} confirm="Videolar onayınız olmadan yayınlanacak. Emin misiniz?">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="evet" /> Onaysız yayını bilerek açıyorum.</label>
              </ActionForm>
            )}
          {s?.mode_changed_at && <p className="mt-2 text-xs text-muted">Son değişiklik: {fmtDateTime(s.mode_changed_at)}</p>}
        </Card>

        <Card title="Instagram" aside={ig?.connected ? <Badge tone="green">Bağlı</Badge> : <Badge tone="red">Bağlı değil</Badge>}>
          {!env.instagram && <div className="mb-3"><Notice tone="warn">Vercel&apos;de INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI ve TOKEN_ENCRYPTION_KEY tanımlı olmalı (docs/kurulum/instagram.md).</Notice></div>}
          {ig?.connected ? (
            <div className="space-y-1 text-sm">
              <p>Hesap: <strong>@{ig.username}</strong></p>
              <p>Token bitişi: <strong>{fmtDateTime(ig.token_expires_at)}</strong> ({daysLeft} gün) · son yenileme {fmtDateTime(ig.last_refreshed_at)}</p>
              <p className="text-xs text-muted">Token haftada bir otomatik yenilenir; yenileme başarısız olur ve 7 günden az kalırsa Telegram&apos;dan uyarı gelir.</p>
              {daysLeft != null && daysLeft < 7 && <Notice tone="error">Token {daysLeft} gün içinde bitiyor. Yeniden bağlayın.</Notice>}
            </div>
          ) : <p className="text-sm text-muted">Bağlantı için Instagram&apos;ın kendi giriş ekranı açılır; şifreniz bize gelmez.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/api/instagram/connect" className="inline-flex items-center rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-2">{ig?.connected ? 'Yeniden bağla' : "Instagram'ı bağla"}</a>
            {ig?.connected && <ActionForm action={disconnectInstagram} label="Bağlantıyı kaldır" variant="danger" confirm="Instagram bağlantısı kaldırılsın mı? Yayın yapılamaz." />}
          </div>
        </Card>

        <Card title="Plan ve saat aralıkları">
          <ActionForm action={setSchedule} label="Kaydet" variant="secondary">
            <div className="space-y-3">
              <Field label="Günlük video sayısı" hint="MVP: 1"><Input type="number" name="daily_video_count" min={1} max={3} defaultValue={s?.daily_video_count ?? 1} /></Field>
              {[0, 1].map((i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Field label={`Aralık ${i + 1} başlangıç`}><Input type="time" name={`w${i + 1}_start`} defaultValue={windows[i]?.start ?? ''} /></Field>
                  <Field label="bitiş"><Input type="time" name={`w${i + 1}_end`} defaultValue={windows[i]?.end ?? ''} /></Field>
                </div>
              ))}
              <p className="text-xs text-muted">İstanbul saati. Sistem bu aralıklarda farklı saatleri dener; veri biriktikçe en iyi ortalamaya yönelir (kesin değildir). Yayın kontrolü GitHub Actions&apos;ta 12:07–14:52 ve 19:07–22:52 arasında çalışır ve birkaç dakika gecikebilir.</p>
            </div>
          </ActionForm>
        </Card>

        <Card title="Entegrasyonlar" className="lg:col-span-2">
          {!env.serviceKey && <div className="mb-3"><Notice tone="error">Vercel&apos;deki SUPABASE_SERVICE_ROLE_KEY eksik veya yanlış türde (ör. Publishable key). Supabase → Project Settings → API Keys → Secret key (sb_secret_…) girip Redeploy edin.</Notice></div>}
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['Supabase Secret key (sb_secret_…)', env.serviceKey],
              ['Instagram ayarları', env.instagram],
              ['Telegram bildirim/onay (Vercel tarafında isteğe bağlı)', env.telegram],
              ['GitHub iş tetikleme (Hemen üret, Fikir araştır)', env.githubDispatch],
              ['GitHub ürün okuma token\'ı (özel repolar için)', env.githubProductRead],
              ['Vercel salt okunur bilgi', env.vercel],
            ].map(([label, ok]) => <li key={String(label)} className="flex items-center gap-2"><Badge tone={ok ? 'green' : 'gray'}>{ok ? 'Tanımlı' : 'Yok'}</Badge>{label}</li>)}
          </ul>
          <p className="mt-3 text-xs text-muted">Değerler burada gösterilmez ve buradan girilmez. Vercel → Settings → Environment Variables ve GitHub → Settings → Secrets üzerinden eklenir.</p>
        </Card>
      </div>
    </>
  );
}
