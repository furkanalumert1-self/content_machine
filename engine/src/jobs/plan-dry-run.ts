// Veritabanı olmadan N günlük planı simüle eder ve docs/ornek-plan-<slug>.md dosyasına yazar.
// Haftalık fikir araştırması da simüle edilir (7 günde bir yeni fikirler eklenir).
// Çalıştırma: npx tsx src/jobs/plan-dry-run.ts callypso-engage [gün=7] [--summary]
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseBrief } from '../brief/brief.ts';
import { generateIdeas } from '../ideas/generate.ts';
import { analyzePerformance } from '../ideas/performance.ts';
import type { Idea } from '../ideas/types.ts';
import { planDay } from '../plan/planner.ts';
import { contentSentences } from '../plan/script.ts';
import type { RecentVideo } from '../plan/rotation.ts';

const slug = process.argv[2] ?? 'callypso-engage';
const days = Number(process.argv[3] ?? 7);
const root = join(import.meta.dirname, '../../..');
const meta = JSON.parse(await readFile(join(root, 'config/products', `${slug}.json`), 'utf8'));
const brief = parseBrief(await readFile(join(root, 'config/products', `${slug}.md`), 'utf8'));

let ideas: Idea[] = [];
const research = () => {
  const fresh = generateIdeas({ brief, commits: [], existing: ideas, performance: analyzePerformance([]) }).ideas;
  ideas = [...ideas, ...fresh.map((d, i) => ({ ...d, id: `fikir-${String(ideas.length + i + 1).padStart(3, '0')}`, product_id: slug, used: false, last_used_at: null }))];
  return fresh.length;
};
const summaryOnly = process.argv.includes('--summary');
const summary: string[] = [];
const recent: RecentVideo[] = [];
const exploration: boolean[] = [];
const out: string[] = [`# Örnek ${days} günlük plan — ${meta.name}`, '', 'Kuru çalıştırma: veritabanına yazılmadı, video üretilmedi. Brief onaylı sürüm.', ''];

for (let d = 0; d < days; d++) {
  const now = new Date(Date.UTC(2026, 9, 22 + d, 6));
  if (d % 7 === 0) summary.push(`Gün ${d + 1}: haftalık araştırma +${research()} fikir (toplam ${ideas.length})`);
  const r = planDay({ brief, ideas, recent, recentExploration: exploration, activeStyles: ['dark-keynote'], phase: 3, now });
  out.push(`## Gün ${d + 1} — ${now.toISOString().slice(0, 10)}`, '');
  if (!r.ok) { out.push(`**Plan yapılamadı:** ${r.reason}`, ''); summary.push(`Gün ${d + 1}: PLAN YOK — ${r.reason}`); continue; }
  const { plan } = r;
  ideas = ideas.map((i) => (i.id === plan.idea.id ? { ...i, used: true, last_used_at: now.toISOString() } : i));
  recent.unshift({ product_id: slug, content_type: plan.script.content_type, style: plan.style, created_at: now.toISOString(), sentences: contentSentences(plan.script) });
  exploration.unshift(plan.idea.is_exploration);

  out.push(`**Tür:** ${plan.script.content_type} · **Süre:** ${plan.script.duration_sec} sn · **Stil:** ${plan.style}${plan.idea.is_exploration ? ' · keşif' : ''}`, '');
  out.push('| Zaman | Sahne | Ekran metni | Görsel |', '|---|---|---|---|');
  for (const s of plan.script.scenes) {
    const visual = s.visual.type + ('chips' in s.visual && s.visual.chips.length ? ` (${s.visual.chips.join(' · ')})` : '') + (s.sample_data ? ' · örnek veri' : '');
    out.push(`| ${s.start.toFixed(1)}–${(s.start + s.duration).toFixed(1)} sn | ${s.kind} | ${s.lines.join(' / ')} | ${visual} |`);
  }
  out.push('', '**Caption:**', '', '```', plan.caption, '```', '', `**Hashtag (${plan.hashtags.length}):** ${plan.hashtags.join(' ')}`, '');
  out.push('<details><summary>Seçim gerekçesi</summary>', '', plan.reason.split('\n').map((l) => `- ${l}`).join('\n'), '', '</details>', '');
  if (plan.script.review_notes.length) out.push(`> ⚠️ ${plan.script.review_notes.join(' ')}`, '');
}
if (summaryOnly) {
  const planned = days - summary.filter((l) => l.includes('PLAN YOK')).length;
  console.log([...summary, `Planlanan gün: ${planned}/${days}`].join('\n'));
} else {
  await writeFile(join(root, 'docs', `ornek-plan-${slug}.md`), out.join('\n'));
  console.log(`docs/ornek-plan-${slug}.md yazıldı`);
}
