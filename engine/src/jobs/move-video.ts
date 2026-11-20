// Henüz yayınlanmamış bir videonun yalnızca yayın saatini değiştirir (yeniden üretim yok).
// Çalıştırma: npx tsx src/jobs/move-video.ts <konu-anahtarı> <ISO zaman, ör. 2026-11-21T13:30:00+03:00>
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { loadBank } from '../topics/bank.ts';

const key = process.argv[2]?.trim();
const at = new Date(process.argv[3] ?? '');
if (!key || !/^[a-z0-9-]+$/.test(key)) throw new Error('Konu anahtarı gerekli.');
if (Number.isNaN(at.getTime()) || at.getTime() < Date.now()) throw new Error('Geçerli ve gelecekte bir zaman gerekli (ör. 2026-11-21T13:30:00+03:00).');

const db = serviceClient('planner');
const log = createLogger('move_video', db);
const bank = loadBank();
const { data: product } = await db.from('products').select('id').eq('slug', bank.product).single();
const { data: idea } = await db.from('ideas').select('id').eq('product_id', product!.id).eq('source', 'topic_bank').eq('source_ref', key).single();
if (!idea) throw new Error(`Konu fikir bankasında yok: ${key}`);
const { data: videos } = await db.from('videos').select('id, status, publish_at')
  .eq('idea_id', idea.id).in('status', ['planned', 'rendering', 'ready', 'approved'])
  .gte('publish_at', new Date().toISOString()).order('publish_at', { ascending: true }).limit(1);
const video = videos?.[0];
if (!video) throw new Error(`${key}: yayınlanmamış, saati gelmemiş video yok.`);
const { error } = await db.from('videos').update({ publish_at: at.toISOString(), publish_at_reason: `Elle taşındı: ${at.toISOString()}` }).eq('id', video.id);
if (error) throw error;
await log.info(`${key}: video ${video.id} yayın saati ${video.publish_at} → ${at.toISOString()} (durum ${video.status}).`);
