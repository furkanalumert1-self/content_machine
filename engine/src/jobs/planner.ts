// Günlük planlayıcı: ürün, içerik türü, fikir ve stil seçer; senaryoyu "planned" video olarak kaydeder.
// Tekrar çalıştırılabilir: bugün için zaten yeterli otomatik video planlandıysa hiçbir şey yapmaz.
// Çalıştırma: npx tsx src/jobs/planner.ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { approvedBrief, listIdeas, markIdeaUsed, recentExplorationFlags } from '../ideas/repo.ts';
import { planDay } from '../plan/planner.ts';
import { chooseProduct, type RecentVideo } from '../plan/rotation.ts';
import { contentSentences } from '../plan/script.ts';
import { startOfLocalDay } from '../plan/time.ts';

const db = serviceClient('planner');
const log = createLogger('planner', db);
const stylesDir = join(import.meta.dirname, '../../../config/styles');

const { data: settings, error: se } = await db.from('app_settings').select('*').single();
if (se) throw se;

const todayStart = startOfLocalDay(new Date(), settings.timezone);
const { count: plannedToday } = await db.from('videos').select('id', { count: 'exact', head: true })
  .eq('origin', 'auto').gte('created_at', todayStart.toISOString());
if ((plannedToday ?? 0) >= settings.daily_video_count) {
  await log.info(`Bugün için ${plannedToday} video zaten planlı; çıkılıyor.`);
  process.exit(0);
}

const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
const { data: recentRows } = await db.from('videos').select('product_id, content_type, style, created_at, script')
  .gte('created_at', since).order('created_at', { ascending: false });
const recent: RecentVideo[] = (recentRows ?? []).map((r) => ({
  product_id: r.product_id, content_type: r.content_type, style: r.style, created_at: r.created_at,
  sentences: r.script?.scenes ? contentSentences(r.script) : [],
}));

const { data: products } = await db.from('products').select('id, slug, site_url').eq('status', 'active');
const product = chooseProduct((products ?? []).map((p) => p.id), recent, settings.multi_product_enabled);
if (!product.id) {
  await log.warn(product.reason);
  process.exit(0);
}
const p = products!.find((x) => x.id === product.id)!;

const brief = await approvedBrief(db, p.id);
if (!brief) {
  await log.warn(`${p.slug}: onaylı brief yok; plan yapılmadı.`);
  process.exit(0);
}

const activeStyles: string[] = [];
for (const f of (await readdir(stylesDir)).filter((f) => f.endsWith('.json'))) {
  const s = JSON.parse(await readFile(join(stylesDir, f), 'utf8'));
  if (s.status === 'mvp' || s.status === 'active') activeStyles.push(s.slug);
}

const result = planDay({
  brief: brief.brief,
  siteUrl: p.site_url,
  ideas: await listIdeas(db, p.id),
  recent: recent.filter((r) => r.product_id === p.id),
  recentExploration: await recentExplorationFlags(db, p.id),
  activeStyles,
});

if (!result.ok) {
  await log.error(`${p.slug}: ${result.reason}`, { problems: result.problems });
  if (result.needsEmergencyResearch) await log.warn('Acil fikir araştırması gerekiyor (idea_research emergency).', { dispatch: 'idea_research' });
  process.exitCode = 1;
} else {
  const { plan } = result;
  const { data: video, error } = await db.from('videos').insert({
    product_id: p.id,
    brief_id: brief.id,
    idea_id: plan.idea.id,
    origin: 'auto',
    style: plan.style,
    content_type: plan.script.content_type,
    duration_sec: plan.script.duration_sec,
    script: plan.script,
    caption: plan.caption,
    hashtags: plan.hashtags,
    plan_reason: `Ürün: ${product.reason}\n${plan.reason}`,
    status: 'planned',
  }).select('id').single();
  if (error) throw error;
  await markIdeaUsed(db, plan.idea.id);
  await log.info(`${p.slug}: video planlandı (${video.id}).`, { idea: plan.idea.idea, duration: plan.script.duration_sec });
  if (plan.needsEmergencyResearch) await log.warn('Kullanılabilir fikir 10\'un altında; acil araştırma istendi.', { dispatch: 'idea_research' });
}
