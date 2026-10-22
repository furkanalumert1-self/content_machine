// Uçtan uca panel testi (yerel Supabase + çalışan panel gerekir). CI'da çalışmaz; kurulum: docs/kurulum/supabase-vercel.md > Geliştirici.
// Çalıştırma: E2E_DB=postgresql://... SUPABASE_URL=... ANON_KEY=... SERVICE_ROLE_KEY=... node e2e/panel.e2e.mjs
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:3000';
const BASE_NOADMIN = process.env.E2E_BASE_NOADMIN ?? 'http://127.0.0.1:3001';
const MAILPIT = process.env.E2E_MAILPIT ?? 'http://127.0.0.1:54324';
const { E2E_DB, SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const sql = (q) => execFileSync('psql', [E2E_DB, '-qAtc', q], { encoding: 'utf8' }).trim();

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`); if (!ok) failed++; };

async function magicLink(email, since) {
  for (let i = 0; i < 30; i++) {
    const { messages = [] } = await (await fetch(`${MAILPIT}/api/v1/messages`)).json();
    const m = messages.find((x) => x.To?.some((t) => t.Address === email) && new Date(x.Created) > since);
    if (m) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      return full.Text.match(/https?:\/\/\S+verify\S+/)?.[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function login(page, base, email) {
  const since = new Date(Date.now() - 1000);
  await page.goto(`${base}/giris`);
  await page.fill('input[name=email]', email);
  await page.click('button[type=submit]');
  await page.getByText('giriş bağlantısı e-postanıza gönderildi').waitFor();
  return magicLink(email, since);
}

// İşlem sonucu mesajı, düğmenin bulunduğu formun içinde (veya verilen kapsamda) görünür.
async function submit(page, scope, label, noticeScope = scope) {
  const notices = noticeScope.locator('[role=status],[role=alert]');
  const before = await notices.count();
  await scope.getByRole('button', { name: label }).click();
  await page.waitForFunction(() => ![...document.querySelectorAll('button')].some((b) => /İşleniyor…|Hazırlanıyor…/.test(b.textContent ?? '')));
  await notices.nth(before).waitFor({ timeout: 15000 }).catch(() => {});
  return ((await notices.last().textContent().catch(() => '')) ?? '').trim();
}

// Yerel test veritabanını bilinen başlangıç durumuna getir (yalnızca yerel test; canlı veritabanında ÇALIŞTIRMAYIN).
if (!/127\.0\.0\.1|localhost/.test(E2E_DB ?? '')) throw new Error('E2E yalnızca yerel veritabanında çalışır.');
sql(`delete from videos where origin='manual';
     delete from ideas where source='manual';
     delete from product_briefs where version > 1;
     update product_briefs set status='approved' where version = 1;
     update videos set status='ready', publish_at = now() + interval '3 hours', caption = regexp_replace(caption, '(\nKısa bir ek not\.)+$', '') where origin='auto';
     update app_settings set paused=false;`);

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
try {
  // ---------------------------------------------------------------- yetkisiz erişim
  const anon = await browser.newPage();
  await anon.goto(`${BASE}/kuyruk`);
  check('Girişsiz kullanıcı panel yerine giriş sayfasına yönlendirilir', anon.url().startsWith(`${BASE}/giris`));
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/videos?select=id`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } });
  check('Anonim REST isteği video göremez (RLS)', JSON.stringify(await r1.json()) === '[]');
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/instagram_connection?select=access_token`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } });
  check('Anonim REST isteği Instagram token tablosuna erişemez', r2.status >= 400, `HTTP ${r2.status}`);

  const signup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yeni-biri@example.com', password: 'Uzun-Bir-Sifre-123' }) });
  check('Herkese açık kayıt kapalı (yeni hesap açılamaz)', signup.status >= 400 && sql(`select count(*) from auth.users where email='yeni-biri@example.com'`) === '0', `HTTP ${signup.status}`);

  // Yönetici olmayan hesap: ADMIN_EMAIL eşleşmediği için bağlantı gönderilmez (yanıt aynı görünür)
  const before = sql(`select count(*) from auth.users where email='yabanci@example.com' and last_sign_in_at is not null`);
  const strangerLink = await login(anon, BASE, 'yabanci@example.com').catch(() => null);
  check('ADMIN_EMAIL dışındaki hesaba giriş bağlantısı gönderilmez', !strangerLink);
  // ADMIN_EMAIL tanımsız örnekte bağlantı gelir ama veritabanındaki yönetici kontrolü (admins) engeller
  const stranger = await browser.newContext();
  const sp = await stranger.newPage();
  const link2 = await login(sp, BASE_NOADMIN, 'yabanci@example.com');
  if (link2) { await sp.goto(link2); await sp.goto(`${BASE_NOADMIN}/kuyruk`); }
  check('Yönetici olmayan hesap oturum açsa bile panele giremez', sp.url().includes('/giris') && decodeURIComponent(sp.url()).includes('yönetici değil'), sp.url());
  void before;

  // Yönetici olmayan JWT ile doğrudan REST: hiçbir şey göremez/değiştiremez
  const pw = 'Gecici-Test-Sifre-123';
  const uid = sql(`select id from auth.users where email='yabanci@example.com'`);
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uid}`, { method: 'PUT', headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
  const tok = await (await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'yabanci@example.com', password: pw }) })).json();
  const h = { apikey: ANON_KEY, Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  check('Yönetici olmayan JWT video göremez', JSON.stringify(await (await fetch(`${SUPABASE_URL}/rest/v1/videos?select=id`, { headers: h })).json()) === '[]');
  const patch = await (await fetch(`${SUPABASE_URL}/rest/v1/app_settings?id=eq.1`, { method: 'PATCH', headers: h, body: JSON.stringify({ paused: true }) })).json();
  check('Yönetici olmayan JWT PAUSED/ayar değiştiremez', Array.isArray(patch) && patch.length === 0 && sql('select paused from app_settings') === 'f');

  // ---------------------------------------------------------------- yönetici akışı
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const link = await login(page, BASE, 'sahip@example.com');
  check('Yöneticiye e-posta ile giriş bağlantısı gelir', !!link);
  await page.goto(link);
  await page.waitForURL(/\/kuyruk/);
  check('Bağlantıyla giriş → Kuyruk sayfası', page.url().includes('/kuyruk'));

  const vid = sql(`select id from videos where status='ready' limit 1`);
  const card = page.locator('section', { has: page.getByText('Onay bekliyor') }).first();
  const src = await card.locator('video').getAttribute('src');
  check('Hazır video kuyrukta imzalı bağlantıyla önizlenir', !!src && src.includes('/storage/v1/object/sign/videos/'), src?.slice(0, 60));
  check('Saat gerekçesi kuyrukta görünür', await card.getByText('Saat gerekçesi:').isVisible());

  // Yasaklı ifadeli düzenleme reddedilir
  await card.locator('summary', { hasText: 'Düzenle' }).click();
  const capBefore = sql(`select caption from videos where id='${vid}'`);
  await card.locator('textarea[name=caption]').fill(`${capBefore}\nSatışların %30 artar!`);
  let msg = await submit(page, card.locator('form', { has: page.locator('textarea[name=caption]') }), 'Kaydet');
  check('Yasaklı ifade içeren caption kaydedilmez', msg.includes('Kaydedilmedi') && sql(`select caption from videos where id='${vid}'`) === capBefore, msg.slice(0, 80));

  // Onay
  msg = await submit(page, card, '✅ Onayla');
  check('Onayla → durum approved ve onay özeti içerikle eşleşir', sql(`select status='approved' and approved_hash=content_hash from videos where id='${vid}'`) === 't', msg.slice(0, 60));

  // Saat değişikliği onayı bozmaz
  await page.reload();
  const card2 = page.locator('section', { has: page.getByText('Onaylandı') }).first();
  await card2.locator('summary', { hasText: 'Düzenle' }).click();
  await card2.locator('input[name=publish_at]').fill('2030-01-15T19:30');
  msg = await submit(page, card2.locator('form', { has: page.locator('input[name=publish_at]') }), 'Saati kaydet');
  check('Saat değişikliği kaydedilir ve onay korunur', sql(`select status='approved' and to_char(publish_at at time zone 'Europe/Istanbul','HH24:MI')='19:30' from videos where id='${vid}'`) === 't', msg.slice(0, 60));

  // İçerik değişince onay düşer
  await card2.locator('textarea[name=caption]').fill(`${capBefore}\nKısa bir ek not.`);
  msg = await submit(page, card2.locator('form', { has: page.locator('textarea[name=caption]') }), 'Kaydet');
  check('Caption değişince eski onay geçersiz olur (status ready)', sql(`select status='ready' and approved_hash is null from videos where id='${vid}'`) === 't', msg.slice(0, 70));

  // ---------------------------------------------------------------- Video iste
  await page.goto(`${BASE}/video-iste`);
  await page.fill('textarea[name=instruction]', 'Mailchimp yerine bizi kullanın.');
  msg = await submit(page, page.locator('form'), 'Kuyruğa ekle', page.locator('main section'));
  check('Rakip adı içeren talimat reddedilir', msg.includes('Rakip adı'), msg.slice(0, 60));
  await page.fill('textarea[name=instruction]', 'Sepet bir sinyaldir. Terk edilen ürünü unutma. Hatırlatma akışıyla takip edilebilir.');
  await page.selectOption('select[name=duration]', '30');
  msg = await submit(page, page.locator('form'), 'Kuyruğa ekle', page.locator('main section'));
  check('Talimattan video planlanır (30 sn, saat ve gerekçesiyle)', msg.includes('Kuyruğa eklendi') && sql(`select count(*) from videos where origin='manual' and status='planned' and duration_sec=30 and publish_at is not null and publish_at_reason is not null`) === '1', msg.slice(0, 60));

  // ---------------------------------------------------------------- Fikir bankası
  await page.goto(`${BASE}/fikirler`);
  const ideaForm = page.locator('form', { has: page.locator('input[name=hook]') });
  await ideaForm.locator('input[name=hook]').fill('Herkese aynı gün mü yazıyorsun?');
  await ideaForm.locator('input[name=idea]').fill('Gönderim sıklığını segmente göre ayarlamak');
  msg = await submit(page, ideaForm, 'Ekle');
  check('Elle fikir eklenir', msg.includes('Fikir eklendi'), msg);

  // ---------------------------------------------------------------- Ürünler: senkronize et → brief taslağı → onay
  await page.goto(`${BASE}/urunler`);
  msg = await submit(page, page.locator('section', { hasText: 'Callypso Engage' }).first(), 'Senkronize et');
  const v2 = sql(`select count(*) from product_briefs where status='draft'`);
  check('"Senkronize et" brief taslağı oluşturur (onaysız)', msg.includes('taslağı') && v2 === '1', msg.split('\n')[0]);
  const videosBefore = sql('select count(*) from videos');
  await page.goto(`${BASE}/urunler/callypso-engage`);
  check('Onaylanmamış taslak üretimde kullanılmaz (onaylı sürüm hâlâ v1)', sql(`select version from product_briefs where status='approved'`) === '1');
  page.once('dialog', (d) => d.accept());
  msg = await submit(page, page.locator('main'), 'Bu sürümü onayla');
  check('Taslak panelden onaylanır, eski sürüm "eski" olur', sql(`select string_agg(version||':'||status, ',' order by version) from product_briefs`) === '1:superseded,2:approved', msg);
  void videosBefore;

  // ---------------------------------------------------------------- Ayarlar
  await page.goto(`${BASE}/ayarlar`);
  page.once('dialog', (d) => d.accept());
  msg = await submit(page, page.locator('section', { hasText: 'PAUSED' }), 'Tüm yayınları durdur');
  check('PAUSED açılır ve başlıkta görünür', sql('select paused from app_settings') === 't' && await page.getByText('DURDURULDU').first().isVisible(), msg.slice(0, 50));
  check('PAUSED açıkken yayın kuyruğundan video alınamaz', sql(`update videos set status='approved' where id='${vid}'; select count(*) from claim_due_video()`).endsWith('0'));
  msg = await submit(page, page.locator('section', { hasText: 'PAUSED' }), 'Yayını yeniden aç');
  check('PAUSED kapatılır', sql('select paused from app_settings') === 'f');
  await page.locator('input[name=confirm]').check();
  page.once('dialog', (d) => d.accept());
  msg = await submit(page, page.locator('section', { hasText: 'Yayın modu' }), 'Otomatik modu aç');
  check('Otomatik mod ilk yayından 7 gün geçmeden açılamaz', msg.includes('7 gün') && sql('select mode from app_settings') === 'approval', msg.slice(0, 70));
  await page.goto(`${BASE}/api/instagram/connect`);
  check('Instagram ayarları eksikse "Instagram\'ı bağla" anlaşılır uyarı verir', page.url().includes('instagram=ayar') && await page.getByText('Instagram ayarları').first().isVisible());

  // Diğer sayfalar hatasız açılır
  for (const p of ['/takvim', '/performans', '/fikirler', '/urunler', '/video-iste', '/ayarlar']) {
    const res = await page.goto(`${BASE}${p}`);
    check(`${p} açılıyor`, res?.status() === 200);
  }
  // Mobil görünüm: yatay kaydırma yok
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${BASE}/kuyruk`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Mobilde (375 px) yatay taşma yok', overflow <= 0, `${overflow}px`);
  await page.screenshot({ path: process.env.E2E_SHOT ?? '/tmp/kuyruk-mobil.png', fullPage: false });
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} KONTROL BAŞARISIZ` : '\nTÜM UÇTAN UCA KONTROLLER GEÇTİ');
process.exit(failed ? 1 : 0);
