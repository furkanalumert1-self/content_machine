// Belirli bir konuyu (konu bankası anahtarı) tek video olarak planlar: önce konu bankası senkronlanır,
// sonra sıradaki boş yayın aralığına (her aralığa günde bir video) "planned" kaydı açılır. Render aynı iş akışında yapılır.
// Çalıştırma: npx tsx src/jobs/plan-topic.ts <konu-anahtarı>
import { activeStyles } from '../config/styles.ts';
import { approvedBrief } from '../ideas/repo.ts';
import type { Idea } from '../ideas/types.ts';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { buildForIdea } from '../plan/planner.ts';
import { scheduleInputs } from '../schedule/repo.ts';
import { chooseSlot } from '../schedule/slots.ts';
import { loadBank } from '../topics/bank.ts';
import type { Phase } from '../topics/channel.ts';
import { syncTopics } from '../topics/sync.ts';

const key = process.argv[2]?.trim();
if (!key || !/^[a-z0-9-]+$/.test(key)) throw new Error('Konu anahtarı gerekli (ör. economist-tuzak-secenek).');

const db = serviceClient('planner');
const log = createLogger('plan_topic', db);
const bank = loadBank();
if (!bank.topics.some((t) => t.key === key)) throw new Error(`Konu bankasında yok: ${key}`);

const { data: product } = await db.from('products').select('id, slug').eq('slug', bank.product).single();
if (!product) throw new Error(`Ürün yok: ${bank.product}`);
const brief = await approvedBrief(db, product.id);
if (!brief) throw new Error(`${product.slug}: onaylı brief yok.`);
const sync = await syncTopics(db, product.id, bank);
for (const x of sync.rejected) await log.warn(`Konu "${x.key}" kurallara uymadı: ${x.problems.join('; ')}`);

const { data: idea } = await db.from('ideas').select('*').eq('product_id', product.id).eq('source', 'topic_bank').eq('source_ref', key).single();
if (!idea) throw new Error(`Konu fikir bankasına alınamadı: ${key}`);
const { data: s } = await db.from('app_settings').select('publish_windows, timezone, content_phase').single();
const { count: stories } = await db.from('videos').select('id', { count: 'exact', head: true }).eq('script->>format', 'story').neq('status', 'rejected');
const built = buildForIdea(idea as Idea, { brief: brief.brief, phase: (s!.content_phase ?? 1) as Phase, caseNo: (stories ?? 0) + 1 });
if (built.problems.length) throw new Error(`Senaryo kurallara uymadı: ${built.problems.join('; ')}`);

const inputs = await scheduleInputs(db);
const slot = chooseSlot({ windows: s!.publish_windows, timezone: s!.timezone, now: new Date(), ...inputs });
const { data: video, error } = await db.from('videos').insert({
  product_id: product.id, brief_id: brief.id, idea_id: idea.id, origin: 'manual', request_instruction: null,
  style: activeStyles()[0].slug, content_type: built.script.content_type, duration_sec: built.script.duration_sec,
  script: built.script, caption: built.caption, hashtags: built.hashtags,
  plan_reason: `Konu elle seçildi: ${key}${'world' in built.script && built.script.world ? ` (özel çizim: ${built.script.world})` : ''}.`,
  publish_at: slot.publishAt.toISOString(), publish_at_reason: slot.reason, status: 'planned',
}).select('id').single();
if (error) throw error;
await db.from('ideas').update({ used: true, last_used_at: new Date().toISOString() }).eq('id', idea.id);
await log.info(`${key}: video planlandı (${video.id}), yayın ${slot.reason.split(' (İstanbul)')[0]}.`);
