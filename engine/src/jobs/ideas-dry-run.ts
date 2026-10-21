// Veritabanı olmadan: gerçek repo + site + brief'ten fikirleri üretip docs/ornek-fikirler-<slug>.md dosyasına yazar.
// Çalıştırma: npx tsx src/jobs/ideas-dry-run.ts callypso-engage [--local <klon-klasörü>]
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseBrief } from '../brief/brief.ts';
import { generateIdeas } from '../ideas/generate.ts';
import { analyzePerformance } from '../ideas/performance.ts';
import { commitsSince, inspectLocalClone, inspectRepo } from '../sync/github.ts';
import { inspectSite } from '../sync/site.ts';

const slug = process.argv[2] ?? 'callypso-engage';
const localIdx = process.argv.indexOf('--local');
const localDir = localIdx > 0 ? process.argv[localIdx + 1] : null;
const root = join(import.meta.dirname, '../../..');
const meta = JSON.parse(await readFile(join(root, 'config/products', `${slug}.json`), 'utf8'));
const brief = parseBrief(await readFile(join(root, 'config/products', `${slug}.md`), 'utf8'));

const repo = !meta.github_repo ? null
  : localDir ? await inspectLocalClone(localDir, meta.github_repo)
  : await inspectRepo(meta.github_repo, process.env.GH_PRODUCT_READ_TOKEN);
const site = meta.site_url ? await inspectSite(meta.site_url) : null;
const result = generateIdeas({
  brief,
  commits: repo ? commitsSince(repo.commits, 14) : [],
  existing: [],
  performance: analyzePerformance([]),
});

const TYPE_TR = { problem_cozum: 'Problem→çözüm', ipucu: 'İpucu', mini_demo: 'Mini demo', once_sonra: 'Önce/sonra', mit_curutme: 'Mit çürütme' };
const lines = [
  `# Örnek fikirler — ${meta.name}`,
  '',
  `Üretim: ${new Date().toISOString().slice(0, 10)} · kuru çalıştırma (veritabanına yazılmadı) · brief durumu: ${brief.status}`,
  '',
  '## Okunan kaynaklar',
  repo ? `- Repo \`${repo.repo}\` @ \`${repo.head_sha.slice(0, 7)}\`: ${repo.commits.length} commit, ${repo.routes.length} sayfa (${repo.routes.join(', ')}), ${repo.releases.length} release, docs/: ${repo.docs.length} dosya` : '- Repo tanımlı değil',
  ...(site?.pages.map((p) => `- Site ${p.url}: "${p.title}" — ${p.headings.length} başlık`) ?? []),
  ...(site?.skipped.map((s) => `- Atlandı: ${s}`) ?? []),
  '',
  '## Notlar',
  ...result.notes.map((n) => `- ${n}`),
  '',
  `## Fikirler (${result.ideas.length})`,
  '',
  '| # | Puan | Tür | Keşif | Hook (ilk 2 sn) | Fikir | Neden |',
  '|---|---|---|---|---|---|---|',
  ...result.ideas.map((i, n) =>
    `| ${n + 1} | ${i.score} | ${TYPE_TR[i.content_type]} | ${i.is_exploration ? '✓' : ''} | ${i.hook} | ${i.idea} | ${i.why} |`.replace(/\n/g, ' '),
  ),
];
const out = join(root, 'docs', `ornek-fikirler-${slug}.md`);
await writeFile(out, lines.join('\n') + '\n');
console.log(`${result.ideas.length} fikir → ${out}`);
