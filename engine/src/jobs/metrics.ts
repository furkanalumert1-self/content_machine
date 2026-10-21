// Günde bir: yayınlanmış Reels'in 24. ve 72. saat metriklerini ve takipçi aktif saatlerini toplar.
// Eksik metrik NULL kalır. Tekrar çalıştırılabilir: her kontrol noktası video başına bir kez yazılır.
// Çalıştırma: npx tsx src/jobs/metrics.ts
import { serviceClient } from '../lib/db.ts';
import { requireEnv } from '../lib/env.ts';
import { createLogger } from '../lib/logger.ts';
import { IgError, InstagramClient } from '../instagram/client.ts';
import { decryptToken, keyFrom } from '../instagram/crypto.ts';
import { dueCheckpoints, onlineFollowersByLocalHour, parseInsights, REEL_METRICS, toRow, type ReelMetric } from '../metrics/insights.ts';
import { tzOffsetMinutes } from '../plan/time.ts';

// Meta: online_followers saatleri UTC−07:00 günlerine göre. Doğrulanamazsa ONLINE_FOLLOWERS_UTC_OFFSET ile değiştirilebilir.
const SOURCE_OFFSET = Number(process.env.ONLINE_FOLLOWERS_UTC_OFFSET ?? -7);

requireEnv('metrics');
const db = serviceClient('metrics');
const log = createLogger('metrics', db);

const { data: conn } = await db.from('instagram_connection').select('*').maybeSingle();
if (!conn || conn.token_status === 'expired' || conn.token_status === 'revoked') {
  await log.warn('Instagram bağlı değil veya token geçersiz; metrik alınmadı.');
  process.exit(0);
}
const ig = new InstagramClient(decryptToken(conn.access_token, keyFrom(process.env.TOKEN_ENCRYPTION_KEY)));
const { data: settings } = await db.from('app_settings').select('timezone').single();
const tz = settings?.timezone ?? 'Europe/Istanbul';

/** Önce hepsini tek istekte dener; Meta bir metriği reddederse metrikleri tek tek ister (desteklenmeyen NULL kalır). */
async function fetchInsights(mediaId: string): Promise<{ values: Partial<Record<ReelMetric, number>>; missing: string[] }> {
  try {
    const values = parseInsights(await ig.mediaInsights(mediaId, REEL_METRICS));
    return { values, missing: REEL_METRICS.filter((m) => values[m] == null) };
  } catch (e) {
    if (!(e instanceof IgError) || e.kind === 'auth') throw e;
    const values: Partial<Record<ReelMetric, number>> = {};
    for (const m of REEL_METRICS) {
      try { Object.assign(values, parseInsights(await ig.mediaInsights(mediaId, [m]))); } catch { /* bu metrik yok */ }
    }
    return { values, missing: REEL_METRICS.filter((m) => values[m] == null) };
  }
}

const since = new Date(Date.now() - 15 * 86_400_000).toISOString();
const { data: videos } = await db.from('videos').select('id, ig_media_id, published_at, metrics(checkpoint)')
  .eq('status', 'published').gte('published_at', since).not('ig_media_id', 'like', 'container:%');

let written = 0;
for (const v of videos ?? []) {
  const done = ((v.metrics as { checkpoint: number | null }[]) ?? []).map((m) => m.checkpoint).filter((c): c is number => c != null);
  for (const checkpoint of dueCheckpoints(new Date(v.published_at), done, new Date())) {
    try {
      const { values, missing } = await fetchInsights(v.ig_media_id);
      const hours = Math.round((Date.now() - new Date(v.published_at).getTime()) / 3_600_000);
      const { error } = await db.from('metrics').upsert(
        { video_id: v.id, checkpoint, hours_after_publish: hours, ...toRow(values), raw: { values, missing } },
        { onConflict: 'video_id,checkpoint', ignoreDuplicates: true },
      );
      if (error) throw error;
      written++;
      if (missing.length) await log.info(`Video ${v.id} (${checkpoint}. saat): Meta şu metrikleri vermedi, boş bırakıldı: ${missing.join(', ')}`);
    } catch (e) {
      await log.error(`Video ${v.id} metrikleri alınamadı: ${(e as Error).message}`, { notify: e instanceof IgError && e.kind === 'auth' });
    }
  }
}

// Takipçi aktif saatleri (≥100 takipçi gerekir; yoksa boş döner)
try {
  const localOffset = tzOffsetMinutes(new Date(), tz) / 60;
  const days = onlineFollowersByLocalHour(await ig.onlineFollowers(conn.ig_user_id), SOURCE_OFFSET, localOffset);
  const rows = days.filter((d) => d.day).flatMap((d) => d.hours.map((n, h) => ({ day: d.day, hour_local: h, followers_online: n })));
  if (rows.length) await db.from('audience_activity').upsert(rows, { onConflict: 'day,hour_local' });
  else await log.info('Takipçi aktif saat verisi yok (100 takipçi altı veya Meta bu hesap için vermiyor).');
} catch (e) {
  await log.info(`Takipçi aktif saat verisi alınamadı: ${(e as Error).message}`);
}

await log.info(`${written} metrik kaydı yazıldı.`);
