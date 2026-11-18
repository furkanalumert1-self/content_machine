// Henüz yayınlanmamış bir videoyu konu bankasının güncel hâliyle yeniden kurar ve yeniden üretime alır.
// Yayın saati ve vaka numarası korunur; render aynı iş akışında yapılır. Örn. okunuş düzeltmesi sonrası.
// Çalıştırma: npx tsx src/jobs/replan.ts <konu-anahtarı>
import { approvedBrief } from '../ideas/repo.ts';
import type { Idea } from '../ideas/types.ts';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { buildForIdea } from '../plan/planner.ts';
import { loadBank } from '../topics/bank.ts';
import type { Phase } from '../topics/channel.ts';
import { syncTopics } from '../topics/sync.ts';

const key = process.argv[2]?.trim();
if (!key || !/^[a-z0-9-]+$/.test(key)) throw new Error('Konu anahtarı gerekli (ör. lego-az-parca).');

const db = serviceClient('planner');
const log = createLogger('replan', db);
const bank = loadBank();
const { data: product } = await db.from('products').select('id, slug').eq('slug', bank.product).single();
if (!product) throw new Error(`Ürün yok: ${bank.product}`);
const brief = await approvedBrief(db, product.id);
if (!brief) throw new Error(`${product.slug}: onaylı brief yok.`);
await syncTopics(db, product.id, bank);

const { data: idea } = await db.from('ideas').select('*').eq('product_id', product.id).eq('source', 'topic_bank').eq('source_ref', key).single();
if (!idea) throw new Error(`Konu fikir bankasında yok: ${key}`);
const { data: videos } = await db.from('videos').select('id, status, publish_at, script')
  .eq('idea_id', idea.id).in('status', ['planned', 'rendering', 'render_failed', 'ready', 'approved'])
  .gte('publish_at', new Date().toISOString()).order('publish_at', { ascending: true }).limit(1);
const video = videos?.[0];
if (!video) throw new Error(`${key}: yayınlanmamış, saati gelmemiş video yok.`);

const { data: s } = await db.from('app_settings').select('content_phase').single();
const caseNo = (video.script as { case_no?: number })?.case_no ?? 1;
const built = buildForIdea(idea as Idea, { brief: brief.brief, phase: (s!.content_phase ?? 1) as Phase, caseNo });
if (built.problems.length) throw new Error(`Senaryo kurallara uymadı: ${built.problems.join('; ')}`);

const { error } = await db.from('videos').update({
  script: built.script, caption: built.caption, hashtags: built.hashtags, duration_sec: built.script.duration_sec,
  status: 'planned', render_attempts: 0,
}).eq('id', video.id);
if (error) throw error;
await log.info(`${key}: video ${video.id} yeniden üretime alındı (önceki durum ${video.status}, yayın saati korunuyor: ${video.publish_at}).`);
