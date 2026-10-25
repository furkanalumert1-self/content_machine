// Fikir + onaylı brief → sahne sahne senaryo. Yapay zekâ API'si kapalıyken metinler yalnızca brief'teki
// cümlelerden kurulur; yeni iddia eklenmez.
import type { Brief, Feature } from '../brief/brief.ts';
import { checkClaims, mentionsUnverified } from '../content/claims.ts';
import type { ContentType, Idea } from '../ideas/types.ts';

export const FPS = 30;
export const MIN_SEC = 15;
export const MAX_SEC = 45;
export const MAX_LINE_CHARS = 70;
export const MAX_HOOK_WORDS = 10;

export type Visual =
  | { type: 'hook' }
  | { type: 'statement' }
  | { type: 'feature'; feature: number; chips: string[] }
  | { type: 'before' }
  | { type: 'after'; feature: number; chips: string[] }
  | { type: 'myth' }
  | { type: 'fact'; number?: string }
  | { type: 'cta' };

export interface Scene {
  id: string;
  kind: 'hook' | 'body' | 'cta';
  start: number;      // saniye
  duration: number;   // saniye
  frames: number;
  lines: string[];    // ekran metni (altyazı olarak da kullanılır; MVP'de seslendirme yok)
  visual: Visual;
  sample_data: boolean;
}

export interface Script {
  version: 1;
  product: string;
  content_type: ContentType;
  hook: string;
  scenes: Scene[];
  duration_sec: number;
  cta: string;
  /** Yalnızca kayıt için; ekranda/caption'da gösterilmez. Profil bağlantısı olarak kullanılır. */
  cta_url: string;
  sample_data: boolean;
  review_notes: string[];
  /** Videonun üst bandında görünen ad (Faz 1: kanal adı; yoksa ürün adı). */
  channel?: string;
  funnel?: import('../ideas/types.ts').Funnel;
  /** Konu bankasından: 3 kanca adayı ve puanları, kaynaklar. */
  hook_candidates?: { hook: string; score: number }[];
  sources?: { label: string; url: string }[];
}

// ---------------------------------------------------------------- metin yardımcıları
const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
const end = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const parts = (s: string) => s.split(';').map((p) => p.trim().replace(/\.$/, '')).filter(Boolean);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Uzun cümleyi önce ";", sonra ortaya en yakın virgül, yoksa boşluktan ekran satırlarına böler. */
export function lineify(text: string): string[] {
  const t = text.trim();
  if (t.length <= MAX_LINE_CHARS) return [t];
  const semi = t.split(/;\s+/);
  if (semi.length > 1) return semi.flatMap((part, i) => lineify(i === semi.length - 1 ? cap(part) : end(cap(part))));
  const commas = [...t.matchAll(/,\s+/g)].map((m) => m.index!);
  if (!commas.length) {
    // Virgül yoksa ortaya en yakın boşluktan bölünür.
    const spaces = [...t.matchAll(/\s+/g)].map((m) => m.index!);
    if (!spaces.length) return [t];
    const at = spaces.sort((a, b) => Math.abs(a - t.length / 2) - Math.abs(b - t.length / 2))[0];
    return [...lineify(t.slice(0, at)), ...lineify(t.slice(at).trim())];
  }
  const mid = commas.sort((a, b) => Math.abs(a - t.length / 2) - Math.abs(b - t.length / 2))[0];
  return [...lineify(t.slice(0, mid + 1)), ...lineify(t.slice(mid + 1).trim())];
}

/** "A, B, C ve D" → [A, B, C, D]; çok uzun öğe varsa çip yapılmaz. */
export function chipsOf(chunk: string): string[] {
  const items = chunk.split(/,\s*|\s+ve\s+/).map((s) => s.trim()).filter(Boolean);
  if (items.length < 3 || items.some((i) => i.length > 26)) return [];
  return items.slice(0, 7);
}

function featureScene(brief: Brief, fi: number, label: string): Omit<Scene, 'start' | 'duration' | 'frames' | 'id'> {
  const f = brief.features[fi];
  return { kind: 'body', lines: [label, f.title], visual: { type: 'feature', feature: fi, chips: chipsOf(parts(f.desc)[0]) }, sample_data: true };
}

function relatedFeature(features: Feature[], text: string): number {
  const t = text.toLocaleLowerCase('tr');
  const rules: [RegExp, RegExp][] = [
    [/sepet/, /otomasyon|akış/i], [/sms|izin/, /kampanya/i], [/e-?posta|mail|segment|büyük marka|retention/, /segment/i],
  ];
  for (const [when, pick] of rules) if (when.test(t)) { const i = features.findIndex((f) => pick.test(f.title)); if (i >= 0) return i; }
  return 0;
}

const refIndex = (ref: string | null, kind: string) => {
  const m = ref?.match(new RegExp(`^brief:${kind}-(\\d+)$`));
  return m ? Number(m[1]) - 1 : null;
};

export type Draft = Omit<Scene, 'start' | 'duration' | 'frames' | 'id'>;

function bodyScenes(idea: Idea, brief: Brief): { scenes: Draft[]; notes: string[] } {
  const notes: string[] = [];
  const pain = refIndex(idea.source_ref, 'acı');
  const feat = refIndex(idea.source_ref, 'özellik');
  const myth = refIndex(idea.source_ref, 'mit');
  const st = (lines: string[], visual: Visual = { type: 'statement' }, sample_data = false): Draft => ({ kind: 'body', lines: lines.flatMap(lineify), visual, sample_data });

  if (idea.source === 'changelog' || idea.source === 'trend' || idea.source === 'manual' || idea.source === 'deployment') {
    notes.push(idea.source === 'manual'
      ? 'Elle verilen talimattan üretildi: metni yayından önce gözden geçirin.'
      : 'Bu fikir brief dışından geldi (commit/trend/elle). Metni yayından önce gözden geçirip Türkçeleştirin; özelliğin canlıda olduğunu doğrulayın.');
    // Talimat cümleleri (hook hariç) en fazla 3 anlatım sahnesine bölünür.
    const sentences = idea.idea.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)
      .filter((x) => x.replace(/[.!?…]$/, '') !== idea.hook.replace(/[.!?…]$/, ''));
    const body = sentences.length ? sentences.slice(0, 3).map((x) => st([end(cap(x))])) : [st([end(idea.idea)])];
    return { scenes: idea.source === 'manual' ? body : [...body, st(['Callypso Engage\'de.'])], notes };
  }

  switch (idea.content_type) {
    case 'problem_cozum': {
      const p = brief.pains[pain ?? 0];
      return { scenes: [st([end(p.desc)]), featureScene(brief, p.featureIndex, 'Çözüm:'), st([end(brief.features[p.featureIndex].tip)])], notes };
    }
    case 'once_sonra': {
      const p = brief.pains[pain ?? 0];
      const f = brief.features[p.featureIndex];
      return {
        scenes: [
          st(['Önce', end(p.desc)], { type: 'before' }),
          { kind: 'body', lines: ['Sonra', f.title], visual: { type: 'after', feature: p.featureIndex, chips: chipsOf(parts(f.desc)[0]) }, sample_data: true },
          st([end(f.tip)]),
        ],
        notes,
      };
    }
    case 'ipucu': {
      const extra = refIndex(idea.source_ref, 'ipucu');
      const fi = extra != null ? brief.extraTips[extra].featureIndex : feat ?? 0;
      const tip = parts(extra != null ? brief.extraTips[extra].tip : brief.features[fi].tip);
      return { scenes: [...(tip[1] ? [st([end(cap(tip[1]))])] : []), featureScene(brief, fi, 'Callypso Engage\'de:')], notes };
    }
    case 'mini_demo': {
      const fi = feat ?? 0;
      const f = brief.features[fi];
      const steps = parts(f.desc).slice(0, 3).map((chunk, i): Draft => {
        const chips = chipsOf(chunk);
        return { kind: 'body', lines: chips.length ? [i === 0 ? f.title : cap(chunk)] : lineify(end(cap(chunk))), visual: { type: 'feature', feature: fi, chips }, sample_data: true };
      });
      return { scenes: [...steps, st([end(f.tip)])], notes };
    }
    case 'mit_curutme': {
      const m = brief.myths[myth ?? 0];
      const truth = m.truth.split(/(?<=[.!?])\s+/).filter(Boolean);
      return {
        scenes: [
          st(['Gerçek:', end(truth[0])], { type: 'myth' }),
          ...(truth[1] ? [st([end(truth.slice(1).join(' '))])] : []),
          featureScene(brief, relatedFeature(brief.features, `${m.myth} ${m.truth}`), 'Callypso Engage\'de:'),
        ],
        notes,
      };
    }
    default:
      // Sütun türleri konu bankasından kurulur (topics/script.ts); buraya yalnızca hatalı kayıtla düşülür.
      return { scenes: [st([end(idea.idea)])], notes: ['Bu içerik türü için brief şablonu yok.'] };
  }
}

function hookFor(idea: Idea): string {
  if (idea.content_type === 'mit_curutme' && idea.source_ref?.startsWith('brief:mit')) {
    return `Mit: ${idea.hook.replace(/\s*Gerçekten mi\?$/, '')}`;
  }
  return idea.hook;
}

// ---------------------------------------------------------------- zamanlama
const readSec = (lines: string[]) => 1.2 + lines.join(' ').length / 15; // büyük ekran metni, ~15 karakter/sn
const toFrames = (s: number) => Math.round(s * FPS);

export function timeline(drafts: Draft[], targetSec?: number, bounds: { min: number; max: number } = { min: MIN_SEC, max: MAX_SEC }): Scene[] {
  const d = drafts.map((s) =>
    s.kind === 'hook' ? Math.min(3, Math.max(2, readSec(s.lines)))
    : s.kind === 'cta' ? 3.5
    : Math.min(6, Math.max(2.2, readSec(s.lines)) + (s.visual.type === 'feature' || s.visual.type === 'after' ? 1 : 0)),
  );
  let total = d.reduce((a, b) => a + b, 0);
  // İstenen süre (panelden) izin verilen aralığa sıkıştırılır; istenmediyse en az alt sınır.
  const target = Math.min(bounds.max, Math.max(bounds.min, targetSec ?? bounds.min));
  const cap = targetSec ? 12 : 7; // sahne başına en fazla uzama
  if (total < target) {
    // Kısa senaryoda gövde sahneleri eşit uzatılır, yetmezse CTA 5 sn'ye kadar uzar.
    const body = d.map((_, i) => i).filter((i) => drafts[i].kind === 'body');
    let missing = target - total;
    const room = body.reduce((s, i) => s + (cap - d[i]), 0);
    for (const i of body) d[i] += room > 0 ? Math.min(cap - d[i], (missing * (cap - d[i])) / room) : 0;
    total = d.reduce((a, b) => a + b, 0);
    missing = target - total;
    if (missing > 0) d[d.length - 1] += Math.min(1.5, missing);
  }
  let t = 0;
  return drafts.map((s, i) => {
    const frames = toFrames(d[i]);
    const scene: Scene = { ...s, id: `s${i}`, start: t / FPS, duration: frames / FPS, frames };
    t += frames;
    return scene;
  });
}

export const CTA_SUBLINE = 'Link profilde';

export function buildScript(idea: Idea, brief: Brief, opts: { targetSec?: number } = {}): Script {
  const { scenes: body, notes } = bodyScenes(idea, brief);
  const hook = hookFor(idea);
  const drafts: Draft[] = [
    { kind: 'hook', lines: [hook], visual: { type: 'hook' }, sample_data: false },
    ...body,
    { kind: 'cta', lines: [brief.cta, CTA_SUBLINE], visual: { type: 'cta' }, sample_data: false },
  ];
  const scenes = timeline(drafts, opts.targetSec);
  const last = scenes[scenes.length - 1];
  return {
    version: 1,
    product: brief.product,
    content_type: idea.content_type,
    hook,
    scenes,
    duration_sec: Math.round((last.start + last.duration) * 100) / 100,
    cta: brief.cta,
    cta_url: brief.ctaUrl,
    sample_data: scenes.some((s) => s.sample_data),
    review_notes: notes,
  };
}

// ---------------------------------------------------------------- caption ve hashtag
const TYPE_TAGS: Partial<Record<ContentType, string[]>> = {
  problem_cozum: ['#müşterisadakati', '#tekrarsatış'],
  once_sonra: ['#müşterisadakati', '#eticaretpazarlama'],
  ipucu: ['#pazarlamaipuçları', '#eticaretipuçları'],
  mini_demo: ['#pazarlamaotomasyonu', '#saas'],
  mit_curutme: ['#pazarlamamitleri', '#dijitalpazarlama'],
};
const FEATURE_TAGS: [RegExp, string[]][] = [
  [/segment/i, ['#segmentasyon']],
  [/otomasyon|akış/i, ['#pazarlamaotomasyonu', '#terkedilmişsepet']],
  [/kampanya|email|sms/i, ['#emailpazarlama', '#smspazarlama']],
  [/customer 360|profil/i, ['#müşterideneyimi']],
  [/şablon|form/i, ['#emailpazarlama', '#izinlipazarlama']],
];

export function buildHashtags(script: Script, brief: Brief): string[] {
  const featureTitles = script.scenes.flatMap((s) => ('feature' in s.visual ? [brief.features[s.visual.feature].title] : [])).join(' ');
  const tags = ['#eticaret', '#retention', ...(TYPE_TAGS[script.content_type] ?? []), ...FEATURE_TAGS.flatMap(([re, t]) => (re.test(featureTitles) ? t : [])), '#CallypsoEngage'];
  const fillers = ['#dijitalpazarlama', '#eticaretpazarlama', '#emailpazarlama'];
  const unique = [...new Set(tags)];
  for (const f of fillers) if (unique.length < 7 && !unique.includes(f)) unique.push(f);
  return unique.slice(0, 10);
}

export function buildCaption(script: Script): string {
  const body = script.scenes.filter((s) => s.kind === 'body').slice(0, 3).map((s) => {
    const label = s.visual.type === 'before' || s.visual.type === 'after' ? `${s.lines[0]}:` : s.lines[0].endsWith(':') ? s.lines[0] : null;
    return label ? `${label} ${s.lines.slice(1).join(' ')}` : s.lines.join('\n');
  });
  return [
    script.hook,
    '',
    ...body,
    '',
    `👉 ${script.cta}: link profilde.`,
    ...(script.sample_data ? ['', 'Videodaki ekranlar ve rakamlar örnek veridir.'] : []),
  ].join('\n');
}

/** Tekrar kontrolü için senaryodaki anlamlı cümleler (etiket ve CTA hariç). */
export function contentSentences(script: Pick<Script, 'scenes'>): string[] {
  // Özellik başlıkları (feature/after sahneleri) doğal olarak tekrar eder; yalnızca anlatım cümleleri sayılır.
  return script.scenes.filter((s) => ['hook', 'statement', 'myth', 'before', 'fact'].includes(s.visual.type)).flatMap((s) => s.lines)
    .filter((l) => l.length > 20).map((l) => l.toLocaleLowerCase('tr'));
}

// ---------------------------------------------------------------- doğrulama
export function validatePlan(script: Script, caption: string, hashtags: string[], brief: Brief): string[] {
  const p: string[] = [];
  const first = script.scenes[0];
  if (first.kind !== 'hook' || first.start !== 0) p.push('İlk sahne hook olmalı ve 0. saniyede başlamalı.');
  if (first.duration > 3) p.push('Hook sahnesi 3 saniyeden uzun.');
  if (words(script.hook) > MAX_HOOK_WORDS) p.push(`Hook çok uzun (${words(script.hook)} kelime, en fazla ${MAX_HOOK_WORDS}).`);
  const last = script.scenes[script.scenes.length - 1];
  if (last.kind !== 'cta' || !last.lines.includes(brief.cta)) p.push(`Son sahne CTA ("${brief.cta}") olmalı.`);
  if (script.duration_sec < MIN_SEC || script.duration_sec > MAX_SEC) p.push(`Süre ${script.duration_sec} sn; ${MIN_SEC}–${MAX_SEC} olmalı.`);
  for (const s of script.scenes) for (const l of s.lines) if (l.length > MAX_LINE_CHARS) p.push(`Satır çok uzun (${l.length} karakter): "${l}"`);

  const allText = [...script.scenes.flatMap((s) => s.lines), caption].join('\n');
  for (const i of checkClaims(allText)) p.push(`Yasaklı ifade (${i.rule}): "${i.match}"`);
  for (const u of mentionsUnverified(allText, brief.unverified)) p.push(`Doğrulanmamış özellik: ${u}`);
  if (script.sample_data && !/örnek veri/i.test(caption)) p.push('Örnek veri gösteriliyor ama caption\'da "örnek veri" notu yok.');

  if (hashtags.length < 5 || hashtags.length > 10) p.push(`Hashtag sayısı ${hashtags.length}; 5–10 olmalı.`);
  if (new Set(hashtags).size !== hashtags.length) p.push('Tekrarlanan hashtag var.');
  for (const h of hashtags) if (!/^#[\p{L}\p{N}_]+$/u.test(h)) p.push(`Geçersiz hashtag: ${h}`);
  if (caption.length + hashtags.join(' ').length + 2 > 2200) p.push('Caption + hashtag 2200 karakteri aşıyor.');
  return p;
}
