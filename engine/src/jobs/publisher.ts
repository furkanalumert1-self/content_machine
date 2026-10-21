// 15 dakikada bir: zamanı gelmiş ve yayın koşullarını sağlayan videoları Instagram'a gönderir.
// Tekrar çalıştırılabilir; mükerrer yayın DB kilidi + container durumu ile engellenir (instagram/publish.ts).
// Çalıştırma: npx tsx src/jobs/publisher.ts
import { serviceClient } from '../lib/db.ts';
import { requireEnv } from '../lib/env.ts';
import { createLogger } from '../lib/logger.ts';
import { InstagramClient } from '../instagram/client.ts';
import { decryptToken, keyFrom } from '../instagram/crypto.ts';
import { publishClaimed, type ClaimedVideo, type PublishDeps } from '../instagram/publish.ts';
import { decideToken } from '../instagram/token.ts';
import { BUCKET } from '../lib/storage.ts';

const MAX_PER_RUN = 3;
const STALE_MINUTES = 20;

requireEnv('publisher');
const db = serviceClient('publisher');
const log = createLogger('publisher', db);

const settings = async () => (await db.from('app_settings').select('paused, mode').single()).data!;
if ((await settings()).paused) {
  await log.info('PAUSED açık; yayın kontrolü yapılmadı.');
  process.exit(0);
}

const { data: conn } = await db.from('instagram_connection').select('*').maybeSingle();
if (!conn) {
  await log.warn('Instagram bağlı değil; panelden "Instagram\'ı bağla".');
  process.exit(0);
}
if (decideToken(conn).action === 'expired') {
  await db.from('instagram_connection').update({ token_status: 'expired' }).eq('id', 1);
  await log.error('Instagram token süresi dolmuş; yayın yapılamıyor. Panelden yeniden bağlayın.', { notify: true });
  process.exit(1);
}
const ig = new InstagramClient(decryptToken(conn.access_token, keyFrom(process.env.TOKEN_ENCRYPTION_KEY)));

const deps: PublishDeps = {
  ig,
  igUserId: conn.ig_user_id,
  async recheck(id) {
    const s = await settings();
    const { data: v } = await db.from('videos').select('status, approved_hash, content_hash').eq('id', id).single();
    return { paused: s.paused, stillPublishable: v?.status === 'publishing' && (v.approved_hash === v.content_hash || s.mode === 'auto') };
  },
  async signedUrl(path, seconds) {
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, seconds);
    if (error || !data) throw new Error(`İmzalı URL oluşturulamadı: ${error?.message}`);
    return data.signedUrl;
  },
  async save(id, patch) {
    const { error } = await db.from('videos').update(patch).eq('id', id);
    if (error) throw new Error(`Video güncellenemedi: ${error.message}`);
  },
  async attempt(id, outcome, code, message) {
    await db.from('publish_attempts').insert({ video_id: id, outcome, error_code: code ?? null, error_message: message ?? null, finished_at: new Date().toISOString() });
  },
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
};

const toClaimed = (v: Record<string, any>): ClaimedVideo => ({
  id: v.id, caption: v.caption, hashtags: v.hashtags, storage_path: v.storage_path, ig_container_id: v.ig_container_id,
  publish_requested_at: v.publish_requested_at, publish_tries: v.publish_tries, approved: !!v.approved_hash && v.approved_hash === v.content_hash,
});

async function handle(v: ClaimedVideo) {
  const out = await publishClaimed(v, deps);
  if (out.result === 'published') await log.info(`Video ${v.id} yayınlandı (${out.mediaId}).`);
  else if (out.result === 'recovered') await log.warn(`Video ${v.id} önceki çalışmada yayınlanmış; tekrar paylaşılmadı.`);
  else if (out.result === 'released') await log.info(`Video ${v.id} kuyruğa döndü: ${out.reason}`);
  else {
    await log.error(`Video ${v.id} yayınlanamadı: ${out.reason}`, { notify: true });
    if (out.auth) await db.from('instagram_connection').update({ token_status: 'revoked' }).eq('id', 1);
  }
}

// 1) Yarıda kalmış yayınlar (çökme/zaman aşımı): container durumuna bakarak güvenle tamamla
const staleBefore = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString();
const { data: stale } = await db.from('videos').select('*').eq('status', 'publishing').lt('publish_started_at', staleBefore);
for (const v of stale ?? []) await handle(toClaimed(v));

// 2) Zamanı gelenler (DB fonksiyonu PAUSED'ı ve onayı kontrol eder, atomik kilitler)
for (let i = 0; i < MAX_PER_RUN; i++) {
  const { data, error } = await db.rpc('claim_due_video');
  if (error) throw error;
  const v = (data as Record<string, any>[] | null)?.[0];
  if (!v) break;
  await handle(toClaimed(v));
}
