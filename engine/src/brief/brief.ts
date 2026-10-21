import { createHash } from 'node:crypto';

export interface Pain { title: string; desc: string; hook: string; featureIndex: number }
export interface Feature { title: string; desc: string; tip: string }
export interface Myth { myth: string; truth: string }

export interface Brief {
  product: string;
  status: 'taslak' | 'onaylı';
  approvedHash: string | null;
  approvedAt: string | null;
  body: string;
  hash: string;
  sections: Record<string, string>;
  pains: Pain[];
  features: Feature[];
  myths: Myth[];
  cta: string;
  forbidden: string[];
  unverified: string[];
}

const REQUIRED_SECTIONS = ['Ürün', 'Hedef kitle', 'Acı noktaları', 'Doğrulanmış özellikler', 'Ton', 'CTA', 'Yasak konular'];

export function hashBody(body: string): string {
  const normalized = body.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function splitFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new BriefError(['Dosyanın başında --- ile ayrılmış bilgi bloğu yok.']);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

function sectionsOf(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = body.split(/^## /m).slice(1);
  for (const p of parts) {
    const nl = p.indexOf('\n');
    out[p.slice(0, nl).trim()] = p.slice(nl + 1).trim();
  }
  return out;
}

const numbered = (s = '') => s.split('\n').filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s+/, ''));
const bullets = (s = '') => s.split('\n').filter((l) => /^-\s/.test(l)).map((l) => l.replace(/^-\s+/, ''));

export class BriefError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Brief geçersiz:\n- ${problems.join('\n- ')}`);
  }
}

export function parseBrief(md: string): Brief {
  const { meta, body } = splitFrontmatter(md);
  const sections = sectionsOf(body);
  const problems: string[] = [];

  for (const s of REQUIRED_SECTIONS) if (!sections[s]?.trim()) problems.push(`"${s}" bölümü eksik veya boş.`);

  const pains: Pain[] = numbered(sections['Acı noktaları']).map((line, i) => {
    const m = line.match(/^\*\*(.+?)\*\*\s+—\s+(.+?)\s+Hook:\s+"(.+?)"\s+→\s+Özellik\s+(\d)/);
    if (!m) {
      problems.push(`Acı noktası ${i + 1} biçimi hatalı (beklenen: **Ad** — açıklama. Hook: "…" → Özellik N).`);
      return { title: '', desc: '', hook: '', featureIndex: 0 };
    }
    return { title: m[1], desc: m[2], hook: m[3], featureIndex: Number(m[4]) - 1 };
  });

  const features: Feature[] = numbered(sections['Doğrulanmış özellikler']).map((line, i) => {
    const m = line.match(/^\*\*(.+?)\*\*\s+—\s+(.+?)\s+İpucu:\s+"(.+?)"/);
    if (!m) {
      problems.push(`Özellik ${i + 1} biçimi hatalı (beklenen: **Ad** — açıklama. İpucu: "…").`);
      return { title: '', desc: '', tip: '' };
    }
    return { title: m[1], desc: m[2], tip: m[3] };
  });

  if (pains.length !== 5) problems.push(`Tam 5 acı noktası olmalı (şu an ${pains.length}).`);
  if (features.length !== 5) problems.push(`Tam 5 doğrulanmış özellik olmalı (şu an ${features.length}).`);
  for (const p of pains) if (p.title && !features[p.featureIndex]) problems.push(`"${p.title}" var olmayan bir özelliğe bağlı.`);

  const myths: Myth[] = numbered(sections['Mitler']).flatMap((line) => {
    const m = line.match(/\*\*Mit:\*\*\s+"(.+?)"\s+—\s+\*\*Gerçek:\*\*\s+(.+)$/);
    return m ? [{ myth: m[1], truth: m[2] }] : [];
  });

  const ctaMatch = (sections['CTA'] ?? '').match(/"(.+?)"/);
  if (!ctaMatch) problems.push('CTA tırnak içinde yazılmalı.');

  const status = meta.status === 'onaylı' ? 'onaylı' : 'taslak';
  if (!meta.product) problems.push('Bilgi bloğunda "product" yok.');
  if (problems.length) throw new BriefError(problems);

  return {
    product: meta.product,
    status,
    approvedHash: meta.approved_hash || null,
    approvedAt: meta.approved_at || null,
    body,
    hash: hashBody(body),
    sections,
    pains,
    features,
    myths,
    cta: ctaMatch![1],
    forbidden: bullets(sections['Yasak konular']),
    unverified: bullets(sections['Doğrulanmamış (videoda söylenmeyecek)']),
  };
}

/** Onay yalnızca onaylandığı andaki metin için geçerlidir; metin değişirse onay düşer. */
export function isApproved(b: Brief): boolean {
  return b.status === 'onaylı' && b.approvedHash === b.hash;
}

export function approveBriefMarkdown(md: string, now = new Date()): string {
  const brief = parseBrief(md);
  const { body } = splitFrontmatter(md);
  return [
    '---',
    `product: ${brief.product}`,
    'status: onaylı',
    `approved_hash: ${brief.hash}`,
    `approved_at: ${now.toISOString()}`,
    '---',
    '',
  ].join('\n') + body.replace(/^\n+/, '');
}
