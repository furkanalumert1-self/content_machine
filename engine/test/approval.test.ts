import { describe, expect, it } from 'vitest';
import { buildButtons, callbackKey, handleUpdate, parseCallback, readyMessage, type ApprovalDeps, type VideoState } from '../src/approvals/telegram-approval.ts';
import { checkClaims } from '../src/content/claims.ts';
import { notify, TelegramApi } from '../src/notify/telegram.ts';

const OWNER = '111222333';
const KEY = callbackKey('a'.repeat(64));
const VID = '30000000-0000-0000-0000-000000000001';

function harness(video: VideoState | null) {
  const calls: string[] = [];
  const deps: ApprovalDeps = {
    ownerChatId: OWNER, key: KEY,
    async loadVideo() { return video; },
    async setStatus(_id, s) { calls.push(`set ${s}`); },
    async answer(_id, t) { calls.push(`answer ${t}`); },
    async clearButtons() { calls.push('clear'); },
    async reply(t) { calls.push(`reply ${t}`); },
  };
  return { deps, calls };
}
const press = (data: string, from = OWNER) => ({ update_id: 1, callback_query: { id: 'cb', from: { id: Number(from) }, data, message: { message_id: 9, chat: { id: Number(from) } } } });
const ready: VideoState = { id: VID, status: 'ready', content_hash: 'h1', publish_at: '2026-10-22T16:00:00Z' };

describe('onay düğmeleri', () => {
  it('callback_data Telegram sınırı (64 bayt) içinde ve ayrıştırılabilir', () => {
    for (const b of buildButtons(KEY, VID, 'h1')[0]) {
      expect(Buffer.byteLength(b.callback_data)).toBeLessThanOrEqual(64);
      expect(parseCallback(b.callback_data)).toMatchObject({ videoId: VID });
    }
  });

  it('sahibin onayı videoyu onaylar, düğmeleri kaldırır, planlanan saati İstanbul saatiyle yazar', async () => {
    const h = harness(ready);
    expect(await handleUpdate(press(buildButtons(KEY, VID, 'h1')[0][0].callback_data), h.deps)).toBe('approved');
    expect(h.calls).toContain('set approved');
    expect(h.calls).toContain('clear');
    expect(h.calls.find((c) => c.startsWith('reply'))).toMatch(/22 Eki 2026 19:00/);
  });

  it('reddet düğmesi', async () => {
    const h = harness(ready);
    expect(await handleUpdate(press(buildButtons(KEY, VID, 'h1')[0][1].callback_data), h.deps)).toBe('rejected');
    expect(h.calls).toContain('set rejected');
  });

  it('başka bir hesabın basışı hiçbir şey yapmaz ve yanıt da vermez', async () => {
    const h = harness(ready);
    expect(await handleUpdate(press(buildButtons(KEY, VID, 'h1')[0][0].callback_data, '999'), h.deps)).toBe('ignored_foreign');
    expect(h.calls).toEqual([]);
  });

  it('sahte imza veya başka anahtarla üretilmiş düğme reddedilir', async () => {
    const forged = buildButtons(callbackKey('b'.repeat(64)), VID, 'h1')[0][0].callback_data;
    const h = harness(ready);
    expect(await handleUpdate(press(forged), h.deps)).toBe('stale');
    expect(h.calls.some((c) => c.startsWith('set'))).toBe(false);
  });

  it('içerik değiştiyse eski düğme geçersiz (onay düşer)', async () => {
    const oldButton = buildButtons(KEY, VID, 'h1')[0][0].callback_data;
    const h = harness({ ...ready, content_hash: 'h2' });
    expect(await handleUpdate(press(oldButton), h.deps)).toBe('stale');
    expect(h.calls.find((c) => c.startsWith('answer'))).toMatch(/içeriği değişti/);
  });

  it('hazır olmayan (ör. zaten reddedilmiş/yayınlanmış) video değişmez', async () => {
    const h = harness({ ...ready, status: 'published' });
    expect(await handleUpdate(press(buildButtons(KEY, VID, 'h1')[0][0].callback_data), h.deps)).toBe('not_ready');
    expect(h.calls.some((c) => c.startsWith('set'))).toBe(false);
  });

  it('bozuk veri', async () => {
    expect(await handleUpdate(press('a:xyz'), harness(ready).deps)).toBe('invalid');
    expect(await handleUpdate({ update_id: 2 }, harness(ready).deps)).toBe('no_callback');
  });

  it('onay mesajı caption, hashtag, saat ve gerekçeyi içerir', () => {
    const m = readyMessage({ caption: 'Hook', hashtags: ['#a'], publish_at: '2026-10-22T16:00:00Z', publish_at_reason: 'keşif', plan_reason: null, duration_sec: 21, review_notes: ['Kontrol et'] });
    expect(m).toMatch(/Hook/);
    expect(m).toMatch(/#a/);
    expect(m).toMatch(/Saat gerekçesi: keşif/);
    expect(m).toMatch(/⚠️ Kontrol et/);
    expect(m).toMatch(/Onaylamazsanız yayınlanmaz/);
  });
});

describe('bildirimler', () => {
  it('Telegram tanımlı değilse sessizce atlar', async () => {
    expect(await notify('x', {})).toBe(false);
  });

  it('gönderilen metinde token/anahtar maskelenir', async () => {
    let body = '';
    const fetcher = async (_u: string, init?: RequestInit) => { body = String(init?.body); return new Response(JSON.stringify({ ok: true, result: {} })); };
    const env = { TELEGRAM_BOT_TOKEN: '123456:' + 'A'.repeat(35), TELEGRAM_CHAT_ID: OWNER, SUPABASE_SERVICE_ROLE_KEY: 'super-gizli-anahtar-123' };
    await notify(`hata: super-gizli-anahtar-123 ve ghp_${'x'.repeat(36)}`, env, fetcher as typeof fetch);
    expect(body).not.toContain('super-gizli-anahtar-123');
    expect(body).not.toContain('ghp_');
    expect(body).toContain('[SUPABASE_SERVICE_ROLE_KEY]');
  });

  it('Telegram hata mesajındaki token maskelenir ve uzun metin kırpılır', async () => {
    const token = '123456:' + 'B'.repeat(35);
    const failing = async () => new Response(JSON.stringify({ ok: false, description: `bad token ${token}` }), { status: 401 });
    const err = (await new TelegramApi(token, failing as typeof fetch).sendMessage('1', 'x').catch((e: unknown) => e)) as Error;
    expect(err.message).not.toContain('BBBBBBBB');
    let sent = '';
    const ok = async (_u: string, init?: RequestInit) => { sent = JSON.parse(String(init?.body)).text; return new Response(JSON.stringify({ ok: true, result: {} })); };
    await new TelegramApi(token, ok as typeof fetch).sendMessage('1', 'a'.repeat(5000));
    expect(sent.length).toBe(4096);
  });
});

describe('kişisel veri', () => {
  it('e-posta ve telefon yakalanır', () => {
    expect(checkClaims('Ayşe: ayse.yilmaz@ornek.com').map((i) => i.rule)).toContain('Kişisel veri (e-posta)');
    expect(checkClaims('Ara: 0532 123 45 67').map((i) => i.rule)).toContain('Kişisel veri (telefon)');
    expect(checkClaims('+90 532 123 45 67').map((i) => i.rule)).toContain('Kişisel veri (telefon)');
  });
  it('süre ve sıradan sayılar telefon sanılmaz', () => {
    expect(checkClaims('20 saniyede 3 adım, 7 segment')).toEqual([]);
  });
});
