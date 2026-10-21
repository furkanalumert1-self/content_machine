// config/products/*.{json,md} → Supabase. Brief metni değiştiyse yeni sürüm açılır;
// yalnızca dosyadaki onay özeti metinle eşleşiyorsa sürüm "approved" olur. Onaylı brief varsa MVP ürünü aktifleşir.
// Çalıştırma: npx tsx src/jobs/brief-sync.ts
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isApproved, parseBrief } from '../brief/brief.ts';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';

const dir = join(import.meta.dirname, '../../../config/products');
const db = serviceClient('product_sync');
const log = createLogger('brief_sync', db);

for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const meta = JSON.parse(await readFile(join(dir, file), 'utf8'));
  const brief = parseBrief(await readFile(join(dir, file.replace(/\.json$/, '.md')), 'utf8'));

  const { data: product, error } = await db
    .from('products')
    .upsert({ slug: meta.slug, name: meta.name, site_url: meta.site_url, github_repo: meta.github_repo,
      vercel_project: meta.vercel_project, brand_colors: meta.brand_colors ?? {} }, { onConflict: 'slug' })
    .select('id, status').single();
  if (error) throw error;

  const { data: latest } = await db.from('product_briefs').select('version')
    .eq('product_id', product.id).order('version', { ascending: false }).limit(1).maybeSingle();
  const { data: sameText } = await db.from('product_briefs').select('id')
    .eq('product_id', product.id).eq('content_hash', brief.hash).maybeSingle();

  const approved = isApproved(brief);
  if (!sameText) {
    await db.from('product_briefs').insert({
      product_id: product.id, version: (latest?.version ?? 0) + 1, content_md: `---\nproduct: ${brief.product}\n---\n${brief.body}`,
      content_hash: brief.hash, status: 'draft', sources: [{ file: `config/products/${file}` }],
    });
    await log.info(`${meta.slug}: brief sürüm ${(latest?.version ?? 0) + 1} eklendi (taslak).`);
  }
  if (approved) {
    const { error: e } = await db.from('product_briefs').update({ status: 'approved', approved_at: brief.approvedAt })
      .eq('product_id', product.id).eq('content_hash', brief.hash).neq('status', 'approved');
    if (e) throw e;
  } else if (brief.status === 'onaylı') {
    await log.warn(`${meta.slug}: brief onaydan sonra değiştirilmiş; onay geçersiz, yeniden onay gerekli.`);
  }

  if (approved && meta.mvp && product.status !== 'active') {
    const { error: e } = await db.from('products').update({ status: 'active' }).eq('id', product.id);
    if (e) await log.error(`${meta.slug}: aktif edilemedi: ${e.message}`);
    else await log.info(`${meta.slug}: ürün aktif.`);
  }
}
