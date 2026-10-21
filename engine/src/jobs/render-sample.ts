// Veritabanı olmadan: brief'ten her içerik türü için bir senaryo kurar, render eder, kalite kontrolünü ve kontak sayfasını yazar.
// Çalıştırma: npx tsx src/jobs/render-sample.ts [içerik-türü...]   (çıktı: out/ornek/)
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseBrief } from '../brief/brief.ts';
import { generateIdeas } from '../ideas/generate.ts';
import { analyzePerformance } from '../ideas/performance.ts';
import { CONTENT_TYPES, type ContentType } from '../ideas/types.ts';
import { buildScript } from '../plan/script.ts';
import { toSrt } from '../render/qc.ts';
import { contactSheet, renderWithRetries } from '../render/render.ts';

const root = join(import.meta.dirname, '../../..');
const outDir = join(root, 'out/ornek');
const meta = JSON.parse(await readFile(join(root, 'config/products/callypso-engage.json'), 'utf8'));
const brief = parseBrief(await readFile(join(root, 'config/products/callypso-engage.md'), 'utf8'));
const ideas = generateIdeas({ brief, commits: [], existing: [], performance: analyzePerformance([]) }).ideas
  .map((d, i) => ({ ...d, id: `i${i}`, product_id: 'p', used: false, last_used_at: null }));

const types = (process.argv.slice(2).length ? process.argv.slice(2) : CONTENT_TYPES) as ContentType[];
for (const type of types) {
  const idea = ideas.find((i) => i.content_type === type)!;
  const script = buildScript(idea, brief);
  const props = {
    script,
    brand: { name: meta.name, navy: meta.brand_colors.navy, navy2: meta.brand_colors.navy_2, accent: meta.brand_colors.cyan },
    featureTitles: brief.features.map((f) => f.title),
  };
  const r = await renderWithRetries(props, outDir, type);
  console.log(`\n## ${type} — ${r.ok ? 'GEÇTİ' : 'BAŞARISIZ'} (${r.attempts}. deneme${r.output ? `, ${(r.output.ms / 1000).toFixed(1)} sn` : ''})`);
  for (const c of r.output?.qc.checks ?? []) console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`);
  for (const e of r.errors) console.log(`! ${e}`);
  writeFileSync(join(outDir, `${type}.srt`), toSrt(script));
  console.log(`kontak: ${await contactSheet(props, outDir, type)}`);
}
