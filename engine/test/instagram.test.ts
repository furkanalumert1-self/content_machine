import { describe, expect, it } from 'vitest';
import { authorizeUrl, classify, exchangeCode, IgError, InstagramClient } from '../src/instagram/client.ts';
import { decryptToken, encryptToken, keyFrom } from '../src/instagram/crypto.ts';
import { MAX_PUBLISH_TRIES, publishClaimed, type ClaimedVideo, type PublishDeps } from '../src/instagram/publish.ts';
import { decideToken } from '../src/instagram/token.ts';

describe('token şifreleme', () => {
  const key = keyFrom('a'.repeat(64));
  it('şifreler, çözer; düz metin saklanmaz', () => {
    const enc = encryptToken('IGAAsecret123', key);
    expect(enc).not.toContain('IGAAsecret123');
    expect(decryptToken(enc, key)).toBe('IGAAsecret123');
  });
  it('değiştirilmiş veriyi veya yanlış anahtarı reddeder', () => {
    const enc = encryptToken('t', key);
    expect(() => decryptToken(enc.slice(0, -2) + 'AA', key)).toThrow();
    expect(() => decryptToken(enc, keyFrom('b'.repeat(64)))).toThrow();
  });
  it('kısa anahtarı reddeder', () => {
    expect(() => keyFrom('abc')).toThrow(/32 bayt/);
  });
});

describe('hata sınıflandırma (Meta hata kodları)', () => {
  it.each([
    [400, 9, 2207042, 'limit'], [400, -2, 2207020, 'new_container'], [400, 24, 2207008, 'new_container'],
    [400, 9007, 2207027, 'not_ready'], [400, -1, 2207001, 'retry'], [400, -2, 2207003, 'retry'],
    [400, 190, null, 'auth'], [403, 10, null, 'auth'], [400, 4, 2207051, 'fatal'], [400, 25, 2207050, 'fatal'],
    [400, 352, 2207026, 'fatal'], [400, 9004, 2207052, 'fatal'], [400, 4, null, 'retry'], [500, null, null, 'retry'], [0, null, null, 'retry'],
  ] as const)('HTTP %i kod %s alt kod %s → %s', (status, code, sub, kind) => {
    expect(classify(status, code, sub)).toBe(kind);
  });
});

describe('InstagramClient', () => {
  it('token\'ı gövdede gönderir, Meta hata yanıtını IgError\'a çevirir', async () => {
    const calls: { url: string; body?: string }[] = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body ? String(init.body) : undefined });
      return new Response(JSON.stringify({ error: { code: 9, error_subcode: 2207042, message: 'limit' } }), { status: 400 });
    };
    const c = new InstagramClient('TOKEN', fetcher as typeof fetch);
    const err = await c.createReelContainer('1', 'https://v', 'cap').catch((e) => e);
    expect(err).toBeInstanceOf(IgError);
    expect(err.kind).toBe('limit');
    expect(calls[0].url).toBe('https://graph.instagram.com/v26.0/1/media');
    expect(calls[0].url).not.toContain('TOKEN');
    expect(calls[0].body).toContain('media_type=REELS');
  });

  it('OAuth adresi doğru izinleri ister', () => {
    const u = new URL(authorizeUrl('123', 'https://p/cb', 'st'));
    expect(u.origin + u.pathname).toBe('https://www.instagram.com/oauth/authorize');
    expect(u.searchParams.get('scope')).toBe('instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights');
    expect(u.searchParams.get('response_type')).toBe('code');
  });

  it('kod değişiminde sondaki #_ atılır', async () => {
    let sent = '';
    const fetcher = async (_: string, init?: RequestInit) => {
      sent = String(init?.body);
      return new Response(JSON.stringify({ data: [{ access_token: 's', user_id: 42, permissions: 'a,b' }] }));
    };
    const r = await exchangeCode('1', 'sec', 'https://p/cb', 'KOD#_', fetcher as typeof fetch);
    expect(sent).toMatch(/(^|&)code=KOD(&|$)/);
    expect(r).toEqual({ shortToken: 's', userId: '42', permissions: ['a', 'b'] });
  });
});

describe('token kararı', () => {
  const now = new Date('2026-11-01T00:00:00Z');
  const conn = (expires: string, refreshed: string | null, connected = '2026-10-01T00:00:00Z') => ({ token_expires_at: expires, last_refreshed_at: refreshed, connected_at: connected });
  it('süresi dolmuşsa expired', () => expect(decideToken(conn('2026-10-31T00:00:00Z', null), now).action).toBe('expired'));
  it('haftada bir yeniler', () => {
    expect(decideToken(conn('2026-12-20T00:00:00Z', '2026-10-30T00:00:00Z'), now).action).toBe('ok');
    expect(decideToken(conn('2026-12-20T00:00:00Z', '2026-10-24T00:00:00Z'), now).action).toBe('refresh');
  });
  it('bitişe 7 günden az kalmışsa ve 24 saatten eskiyse yeniler', () => {
    expect(decideToken(conn('2026-11-05T00:00:00Z', '2026-10-31T00:00:00Z'), now)).toEqual({ action: 'refresh', daysLeft: 4 });
  });
});

// ---------------------------------------------------------------- yayın akışı (sahte Instagram)
type Status = 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';
function harness(opts: { statuses?: Status[]; publishError?: IgError; createError?: IgError; limit?: { used: number; total: number }; paused?: boolean; publishable?: boolean; recent?: { id: string; caption: string; timestamp: string }[] } = {}) {
  const log: string[] = [];
  const saved: Record<string, unknown>[] = [];
  const statuses = [...(opts.statuses ?? ['FINISHED'])];
  const deps: PublishDeps = {
    igUserId: 'IGU',
    ig: {
      async createReelContainer(_u, url, caption) { log.push(`create ${url} ${caption.split('\n')[0]}`); if (opts.createError) throw opts.createError; return { id: 'C1' }; },
      async containerStatus(id) { log.push(`status ${id}`); return { status_code: statuses.length > 1 ? statuses.shift()! : statuses[0] }; },
      async publish(_u, id) { log.push(`publish ${id}`); if (opts.publishError) throw opts.publishError; return { id: 'M1' }; },
      async publishingLimit() { return opts.limit ?? { used: 0, total: 100 }; },
      async recentMedia() { return opts.recent ?? []; },
      async permalink() { return { permalink: 'https://instagram.com/reel/x' }; },
    },
    async recheck() { log.push('recheck'); return { paused: !!opts.paused, stillPublishable: opts.publishable ?? true }; },
    async signedUrl(path) { return `https://signed/${path}`; },
    async save(_id, patch) { saved.push(patch); log.push(`save ${Object.keys(patch).join(',')}`); },
    async attempt(_id, outcome) { log.push(`attempt ${outcome}`); },
    async sleep() { /* anında */ },
  };
  return { deps, log, saved };
}
const video = (extra: Partial<ClaimedVideo> = {}): ClaimedVideo => ({
  id: 'v1', caption: 'Hook\n\nGövde', hashtags: ['#a', '#b'], storage_path: 'p/v1.mp4', ig_container_id: null,
  publish_requested_at: null, publish_tries: 0, approved: true, ...extra,
});

describe('publishClaimed', () => {
  it('normal akış: container hemen kaydedilir, yayın isteği yayından önce yazılır, tek yayın', async () => {
    const h = harness({ statuses: ['IN_PROGRESS', 'FINISHED'] });
    const out = await publishClaimed(video(), h.deps);
    expect(out).toEqual({ result: 'published', mediaId: 'M1' });
    const i = (s: string) => h.log.findIndex((l) => l.startsWith(s));
    expect(h.log.filter((l) => l.startsWith('publish')).length).toBe(1);
    expect(i('save ig_container_id')).toBeLessThan(i('status'));
    expect(i('recheck')).toBeLessThan(i('publish'));
    expect(i('save publish_requested_at')).toBeLessThan(i('publish'));
    expect(h.log[i('create')]).toBe('create https://signed/p/v1.mp4 Hook');
    expect(h.saved.at(-1)).toMatchObject({ status: 'published', ig_media_id: 'M1', ig_permalink: 'https://instagram.com/reel/x' });
  });

  it('caption\'a hashtag\'ler eklenir', async () => {
    const h = harness();
    let caption = '';
    h.deps.ig.createReelContainer = async (_u, _v, c) => { caption = c; return { id: 'C1' }; };
    await publishClaimed(video(), h.deps);
    expect(caption).toBe('Hook\n\nGövde\n\n#a #b');
  });

  it('PAUSED yayından hemen önce açıldıysa yayınlamaz, kuyruğa döner (container korunur)', async () => {
    const h = harness({ paused: true });
    expect(await publishClaimed(video(), h.deps)).toMatchObject({ result: 'released' });
    expect(h.log.some((l) => l.startsWith('publish'))).toBe(false);
    expect(h.saved.at(-1)).toMatchObject({ status: 'approved' });
    expect(h.saved.at(-1)).not.toHaveProperty('ig_container_id');
  });

  it('onay yayından önce düştüyse yayınlamaz', async () => {
    const h = harness({ publishable: false });
    expect(await publishClaimed(video(), h.deps)).toMatchObject({ result: 'failed' });
    expect(h.log.some((l) => l.startsWith('publish'))).toBe(false);
  });

  it('kayıtlı container zaten PUBLISHED ise tekrar paylaşmaz, medyayı bulur', async () => {
    const h = harness({ statuses: ['PUBLISHED'], recent: [{ id: 'M9', caption: 'Hook\n\nGövde\n\n#a #b', timestamp: '2026-10-22T10:00:00Z' }] });
    expect(await publishClaimed(video({ ig_container_id: 'C1', publish_requested_at: '2026-10-22T09:59:00Z' }), h.deps)).toEqual({ result: 'recovered', mediaId: 'M9' });
    expect(h.log.some((l) => l.startsWith('publish') || l.startsWith('create'))).toBe(false);
  });

  it('media_publish ağ hatası: kuyruğa döner; sonraki çalışmada container PUBLISHED ise tekrar paylaşmaz', async () => {
    const first = harness({ publishError: new IgError(0, null, null, 'ağ') });
    expect(await publishClaimed(video(), first.deps)).toMatchObject({ result: 'released' });
    const second = harness({ statuses: ['PUBLISHED'] });
    const out = await publishClaimed(video({ ig_container_id: 'C1', publish_requested_at: 'x', publish_tries: 1 }), second.deps);
    expect(out.result).toBe('recovered');
    expect(second.log.some((l) => l.startsWith('publish'))).toBe(false);
  });

  it('media_publish ağ hatası ama gönderi gerçekte yapılmamışsa (FINISHED) aynı container ile bir kez yayınlar', async () => {
    const h = harness({ statuses: ['FINISHED'] });
    expect(await publishClaimed(video({ ig_container_id: 'C1', publish_requested_at: 'x', publish_tries: 1 }), h.deps)).toMatchObject({ result: 'published' });
    expect(h.log.some((l) => l.startsWith('create'))).toBe(false);
  });

  it('günlük limit doluysa container oluşturmadan erteler', async () => {
    const h = harness({ limit: { used: 100, total: 100 } });
    expect(await publishClaimed(video(), h.deps)).toMatchObject({ result: 'released' });
    expect(h.log.some((l) => l.startsWith('create'))).toBe(false);
  });

  it('işleme 5 dakikada bitmezse container korunarak kuyruğa döner', async () => {
    const h = harness({ statuses: ['IN_PROGRESS'] });
    expect(await publishClaimed(video(), h.deps)).toMatchObject({ result: 'released' });
    expect(h.log.filter((l) => l.startsWith('status')).length).toBe(6);
  });

  it(`container ERROR ${MAX_PUBLISH_TRIES}. denemede kalıcı başarısızlık olur`, async () => {
    expect(await publishClaimed(video({ publish_tries: 0 }), harness({ statuses: ['ERROR'] }).deps)).toMatchObject({ result: 'released' });
    expect(await publishClaimed(video({ publish_tries: MAX_PUBLISH_TRIES - 1 }), harness({ statuses: ['ERROR'] }).deps)).toMatchObject({ result: 'failed' });
  });

  it('token geçersizse (190) yeniden bağlanma ister', async () => {
    const h = harness({ createError: new IgError(400, 190, null, 'Invalid OAuth access token') });
    expect(await publishClaimed(video(), h.deps)).toMatchObject({ result: 'failed', auth: true });
  });

  it('auto modda (onaysız) alınan video geri dönerken "ready" olur', async () => {
    const h = harness({ paused: true });
    await publishClaimed(video({ approved: false }), h.deps);
    expect(h.saved.at(-1)).toMatchObject({ status: 'ready' });
  });
});
