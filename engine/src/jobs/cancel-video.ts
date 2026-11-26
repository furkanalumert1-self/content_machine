// Henüz yayınlanmamış bir videoyu iptal eder (status → rejected); yayın kontrolü artık onu paylaşmaz.
// Çalıştırma: npx tsx src/jobs/cancel-video.ts <konu-anahtarı>
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { loadBank } from '../topics/bank.ts';

const key = process.argv[2]?.trim();
if (!key || !/^[a-z0-9-]+$/.test(key)) throw new Error('Konu anahtarı gerekli.');
const db = serviceClient('planner');
const log = createLogger('cancel_video', db);
const bank = loadBank();
const { data: product } = await db.from('products').select('id').eq('slug', bank.product).single();
const { data: idea } = await db.from('ideas').select('id').eq('product_id', product!.id).eq('source', 'topic_bank').eq('source_ref', key).single();
if (!idea) throw new Error(`Konu fikir bankasında yok: ${key}`);
const { data: videos } = await db.from('videos').select('id, status, publish_at')
  .eq('idea_id', idea.id).in('status', ['planned', 'rendering', 'render_failed', 'ready', 'approved'])
  .gte('publish_at', new Date().toISOString());
if (!videos?.length) throw new Error(`${key}: iptal edilecek yayınlanmamış video yok.`);
for (const v of videos) {
  const { error } = await db.from('videos').update({ status: 'rejected' }).eq('id', v.id);
  if (error) throw error;
  await log.info(`${key}: video ${v.id} iptal edildi (önceki durum ${v.status}, yayın ${v.publish_at}).`);
}
