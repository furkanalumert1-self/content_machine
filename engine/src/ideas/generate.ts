import type { Brief } from '../brief/brief.ts';
import { checkClaims, mentionsUnverified } from '../content/claims.ts';
import type { PerformanceInsight } from './performance.ts';
import { CONTENT_TYPES, type Commit, type ContentType, type IdeaDraft } from './types.ts';

// Yapay zekâ API'si kapalıyken fikirler onaylı brief'teki cümlelerden kurallarla türetilir.
// Brief dışında bilgi eklenmez; böylece doğrulanmamış iddia üretilemez.

const BASE_SCORE: Record<IdeaDraft['source'], number> = {
  changelog: 80, audience: 65, trend: 60, performance: 70, manual: 75, deployment: 55,
};
const TYPE_BONUS: Record<ContentType, number> = { problem_cozum: 6, mini_demo: 4, ipucu: 3, once_sonra: 2, mit_curutme: 1 };

const FEATURE_COMMIT = /^(add|feat|new|ekle|yeni)\b/i;

export interface GenerateInput {
  brief: Brief;
  commits: Commit[];            // son 14 gün
  existing: { idea: string; hook: string }[];
  performance: PerformanceInsight;
  trendNotes?: { title: string; ref: string }[]; // yapılandırılmışsa resmi API/arama sonucu
  now?: Date;
}

export interface GenerateResult {
  ideas: IdeaDraft[];
  notes: string[];
}

export const normalize = (s: string) =>
  s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function candidates(input: GenerateInput): { drafts: IdeaDraft[]; notes: string[] } {
  const { brief, commits, trendNotes = [] } = input;
  const out: IdeaDraft[] = [];
  const notes: string[] = [];
  const add = (d: Omit<IdeaDraft, 'score' | 'is_exploration'>) =>
    out.push({ ...d, score: BASE_SCORE[d.source] + TYPE_BONUS[d.content_type], is_exploration: false });

  // 1) Son 14 günün commit'leri → duyuru fikri adayı (yalnızca özellik ekleyen commit'ler)
  const featureCommits = commits.filter((c) => FEATURE_COMMIT.test(c.message.split('\n')[0]));
  if (!featureCommits.length) notes.push('Son 14 günde yeni özellik commit\'i yok; duyuru fikri üretilmedi.');
  for (const c of featureCommits.slice(0, 3)) {
    const title = c.message.split('\n')[0];
    add({
      idea: `Yeni: ${title}`,
      hook: 'Bu hafta üründe yeni bir şey var.',
      content_type: 'mini_demo',
      source: 'changelog',
      source_ref: c.sha,
      why: `Son 14 gündeki commit (${c.sha.slice(0, 7)}, ${c.date.slice(0, 10)}). Yayından önce özelliğin canlıda olduğu elle doğrulanmalı.`,
    });
  }

  // 2) Hedef kitle sorunları (onaylı brief'teki acı noktaları)
  brief.pains.forEach((p, i) => {
    const f = brief.features[p.featureIndex];
    add({
      idea: `${p.title}: ${f.title} ile çözüm`,
      hook: p.hook,
      content_type: 'problem_cozum',
      source: 'audience',
      source_ref: `brief:acı-${i + 1}`,
      why: `Brief'teki acı noktası "${p.title}", doğrulanmış özellik "${f.title}" ile eşleşiyor.`,
    });
    add({
      idea: `Önce/sonra: ${p.title} → ${f.title}`,
      hook: `Önce: ${p.title.toLocaleLowerCase('tr')}. Sonra?`,
      content_type: 'once_sonra',
      source: 'audience',
      source_ref: `brief:acı-${i + 1}`,
      why: `Aynı acı noktası süreç farkı olarak anlatılır; sonuç rakamı verilmez.`,
    });
  });

  // Doğrulanmış özellikler → ipucu ve mini demo
  brief.features.forEach((f, i) => {
    add({
      idea: `İpucu: ${f.tip}`,
      hook: f.tip.split(/[;.]/)[0] + '.',
      content_type: 'ipucu',
      source: 'audience',
      source_ref: `brief:özellik-${i + 1}`,
      why: `Doğrulanmış özellik "${f.title}" için uygulanabilir tek ipucu.`,
    });
    add({
      idea: `Mini demo: ${f.title} (örnek veri)`,
      hook: `20 saniyede: ${f.title}.`,
      content_type: 'mini_demo',
      source: 'audience',
      source_ref: `brief:özellik-${i + 1}`,
      why: `Demo modundaki ekran gösterilir; ekrandaki rakamlar "örnek veri" etiketiyle.`,
    });
  });

  brief.extraTips.forEach((t, i) => {
    const f = brief.features[t.featureIndex];
    add({
      idea: `İpucu: ${t.tip}`,
      hook: t.tip.split(/[;.]/)[0] + '.',
      content_type: 'ipucu',
      source: 'audience',
      source_ref: `brief:ipucu-${i + 1}`,
      why: `Brief'teki ek ipucu; doğrulanmış özellik "${f.title}" ile ilgili.`,
    });
  });

  brief.myths.forEach((m, i) =>
    add({
      idea: `Mit: ${m.myth}`,
      hook: `"${m.myth}" Gerçekten mi?`,
      content_type: 'mit_curutme',
      source: 'audience',
      source_ref: `brief:mit-${i + 1}`,
      why: `Brief'teki mit; düzeltme: ${m.truth}`,
    }),
  );

  // 3) Trend ve sektör haberleri (yalnızca resmi API/arama yapılandırılmışsa)
  if (!trendNotes.length) notes.push('Trend kaynağı yapılandırılmadı; trend fikri üretilmedi.');
  for (const t of trendNotes.slice(0, 3)) {
    const f = brief.features[0];
    add({
      idea: `Gündem: ${t.title} — ${f.title} açısından`,
      hook: `${t.title}: retention için ne anlama geliyor?`,
      content_type: 'ipucu',
      source: 'trend',
      source_ref: t.ref,
      why: `Sektör gündemi; kaynak: ${t.ref}`,
    });
  }

  // 4) Performans
  notes.push(input.performance.note);
  return { drafts: out, notes };
}

export function generateIdeas(input: GenerateInput, { min = 15, max = 20 } = {}): GenerateResult {
  const { drafts, notes } = candidates(input);
  const seen = new Set(input.existing.flatMap((e) => [normalize(e.idea), normalize(e.hook)]));

  const clean = drafts.filter((d) => {
    const text = `${d.idea} ${d.hook}`;
    const issues = checkClaims(text);
    const unverified = mentionsUnverified(text, input.brief.unverified);
    if (issues.length || unverified.length) {
      notes.push(`Elendi (uygunsuz ifade): "${d.idea}" → ${[...issues.map((i) => i.rule), ...unverified].join(', ')}`);
      return false;
    }
    if (seen.has(normalize(d.idea)) || seen.has(normalize(d.hook))) return false;
    seen.add(normalize(d.idea));
    return true;
  });

  for (const d of clean) d.score = Math.max(0, Math.min(100, d.score + (input.performance.typeAdjust[d.content_type] ?? 0)));
  clean.sort((a, b) => b.score - a.score);

  // Planner içerik türlerini döndürdüğü için her türden en az 2 fikir; kalan yer puana göre.
  const picked: IdeaDraft[] = [];
  for (const t of CONTENT_TYPES) picked.push(...clean.filter((d) => d.content_type === t).slice(0, 2));
  for (const d of clean) if (picked.length < max && !picked.includes(d)) picked.push(d);
  picked.splice(max);
  picked.sort((a, b) => b.score - a.score);

  // Keşif: en az bilinen içerik türlerinden 3 fikir, işaretli.
  const exploreTypes = Object.entries(input.performance.typeAdjust).length
    ? Object.entries(input.performance.typeAdjust).sort((a, b) => a[1] - b[1]).map(([t]) => t)
    : ['mit_curutme', 'once_sonra', 'ipucu'];
  let explorationCount = 0;
  for (const d of [...picked].reverse()) {
    if (explorationCount >= 3) break;
    if (exploreTypes.includes(d.content_type) && !d.is_exploration) {
      d.is_exploration = true;
      d.why += ' [Keşif fikri: az denenen tür, sonuçtan öğrenmek için.]';
      explorationCount++;
    }
  }

  if (picked.length < min) notes.push(`Yalnızca ${picked.length} yeni fikir üretilebildi (hedef ${min}). Brief'e acı noktası/mit eklemek veya yapay zekâ API'sini açmak sayıyı artırır.`);
  return { ideas: picked, notes };
}
