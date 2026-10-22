// İlk kurulum: config/products/*.{json,md} → Supabase. Panel kurulduktan sonra brief'in asıl yeri veritabanıdır:
// ürünün veritabanında brief'i varsa dosya YÜKLENMEZ (paneldeki düzenlemelerin üzerine yazılmasın).
// Dosyadaki onay özeti metinle eşleşiyorsa ilk sürüm "approved" yüklenir ve MVP ürünü aktifleşir.
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

  // Ürün yoksa oluştur; varsa paneldeki bilgilere dokunma.
  await db.from('products').upsert(
    { slug: meta.slug, name: meta.name, site_url: meta.site_url, github_repo: meta.github_repo, vercel_project: meta.vercel_project, brand_colors: meta.brand_colors ?? {} },
    { onConflict: 'slug', ignoreDuplicates: true },
  );
  const { data: product, error } = await db.from('products').select('id, status').eq('slug', meta.slug).single();
  if (error) throw error;

  const { count } = await db.from('product_briefs').select('id', { count: 'exact', head: true }).eq('product_id', product.id);
  if (count) {
    console.log(`${meta.slug}: brief panelden yönetiliyor; dosya yüklenmedi.`);
    continue;
  }

  const brief = parseBrief(await readFile(join(dir, file.replace(/\.json$/, '.md')), 'utf8'));
  const approved = isApproved(brief);
  const { error: e1 } = await db.from('product_briefs').insert({
    product_id: product.id, version: 1, content_md: `---\nproduct: ${brief.product}\n---\n${brief.body}`, content_hash: brief.hash,
    status: approved ? 'approved' : 'draft', approved_at: approved ? brief.approvedAt : null, sources: [{ file: `config/products/${file}` }],
  });
  if (e1) throw e1;
  await log.info(`${meta.slug}: brief ilk kez yüklendi (${approved ? 'onaylı' : 'taslak — panelden onaylayın'}).`);
  if (!approved && brief.status === 'onaylı') await log.warn(`${meta.slug}: dosyadaki onay metinle eşleşmiyor; panelden yeniden onaylayın.`);

  if (approved && meta.mvp && product.status !== 'active') {
    const { error: e2 } = await db.from('products').update({ status: 'active' }).eq('id', product.id);
    if (e2) await log.error(`${meta.slug}: aktif edilemedi: ${e2.message}`);
    else await log.info(`${meta.slug}: ürün aktif.`);
  }
}
