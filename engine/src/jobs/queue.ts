// Yayınlanmamış videoları (bugünden itibaren) ve son 30 günde yayınlanan konuları listeler; yalnızca okur.
// Çalıştırma: npx tsx src/jobs/queue.ts
import { serviceClient } from '../lib/db.ts';

const db = serviceClient('planner');
const now = new Date();
const dayStart = new Date(now.getTime() - 12 * 3600_000).toISOString();
const { data: up, error } = await db.from('videos').select('publish_at, status, ideas(source_ref)')
  .neq('status', 'rejected').neq('status', 'published').gte('publish_at', dayStart).order('publish_at');
if (error) throw error;
console.log('KUYRUK');
for (const v of up ?? []) console.log(`${v.publish_at}\t${v.status}\t${(v as any).ideas?.source_ref ?? '-'}`);
const { data: pub } = await db.from('videos').select('published_at, ideas(source_ref)')
  .eq('status', 'published').gte('published_at', new Date(now.getTime() - 40 * 86_400_000).toISOString()).order('published_at');
console.log('YAYINLANAN');
for (const v of pub ?? []) console.log(`${v.published_at}\t${(v as any).ideas?.source_ref ?? '-'}`);
