// Haftalık (veya acil) fikir işi: Sepet Röntgeni konu bankasını (kaynakları doğrulanmış) fikir tablosuna senkronlar.
// Faz 3'te ayrıca ürün brief'inden ürün tanıtımı (BOF) fikirleri üretir.
// Çalıştırma: npx tsx src/jobs/idea-research.ts [weekly|emergency|manual]
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { generateIdeas } from '../ideas/generate.ts';
import { analyzePerformance } from '../ideas/performance.ts';
import { approvedBrief, insertIdeas, listIdeas, performanceRows } from '../ideas/repo.ts';
import { commitsSince, inspectRepo, LeakSuspectedError } from '../sync/github.ts';
import { loadBank } from '../topics/bank.ts';
import { syncTopics } from '../topics/sync.ts';

const trigger = (process.argv[2] ?? 'weekly') as 'weekly' | 'emergency' | 'manual';
const db = serviceClient('idea_research');
const log = createLogger('idea_research', db);

const { data: settings } = await db.from('app_settings').select('timezone, content_phase').single();
const phase = settings?.content_phase ?? 1;
const bank = loadBank();
const { data: products, error } = await db.from('products').select('id, slug, github_repo').eq('status', 'active');
if (error) throw error;
if (!products?.length) await log.warn('Aktif ürün yok; araştırma yapılmadı.');

let failed = false;
for (const p of products ?? []) {
  try {
    const brief = await approvedBrief(db, p.id);
    if (!brief) { await log.warn(`${p.slug}: onaylı brief yok, atlandı.`); continue; }

    const notes: string[] = [];
    let bankAdded = 0;
    if (p.slug === bank.product) {
      const r = await syncTopics(db, p.id, bank);
      bankAdded = r.added;
      notes.push(`Konu bankası: ${r.added} yeni, ${r.updated} güncellendi, ${r.removed} çıkarıldı.`);
      for (const x of r.rejected) await log.warn(`Konu "${x.key}" kurallara uymadığı için alınmadı: ${x.problems.join('; ')}`);
    }
    if (phase < 3) {
      // Faz 1–2: ürün tanıtımı feed'e girmez; brief'ten fikir üretilmez.
      await db.from('research_runs').insert({ product_id: p.id, trigger, added: bankAdded, notes });
      await log.info(`${p.slug}: ${notes.join(' ')}`, { trigger, phase });
      continue;
    }
    let commits: Awaited<ReturnType<typeof inspectRepo>>['commits'] = [];
    if (p.github_repo) {
      try {
        commits = commitsSince((await inspectRepo(p.github_repo, process.env.GH_PRODUCT_READ_TOKEN)).commits, 14);
      } catch (e) {
        if (e instanceof LeakSuspectedError) throw e; // sızıntı şüphesinde tamamen dur
        notes.push(`GitHub reposu okunamadı (${(e as Error).message}); changelog kaynağı bu çalışmada atlandı.`);
      }
    } else notes.push('GitHub reposu tanımlı değil; changelog kaynağı atlandı.');

    const existing = await listIdeas(db, p.id);
    const performance = analyzePerformance(await performanceRows(db, p.id, settings?.timezone ?? 'Europe/Istanbul'));
    const result = generateIdeas({ brief: brief.brief, commits, existing, performance });
    const added = await insertIdeas(db, p.id, result.ideas.map((i) => ({ ...i, funnel: 'BOF' as const })));
    notes.push(...result.notes);

    await db.from('research_runs').insert({ product_id: p.id, trigger, added, notes });
    await log.info(`${p.slug}: ${added} fikir eklendi.`, { trigger, notes });
  } catch (e) {
    failed = true;
    if (e instanceof LeakSuspectedError) await log.error(`${p.slug}: ${e.message}`);
    else await log.error(`${p.slug}: fikir araştırması başarısız: ${(e as Error).message}`);
  }
}
if (failed) process.exitCode = 1;
