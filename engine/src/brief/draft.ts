// "Senkronize et": repo + site + Vercel bilgisinden brief taslağı. Eksik bilgi uydurulmaz; doldurulması gereken
// yerler "BİLGİ YOK" olarak işaretlenir. Taslak, kullanıcı onaylamadan içerik üretiminde kullanılmaz.
import type { RepoReport } from '../sync/github.ts';
import type { PageReport } from '../sync/site.ts';

export interface SyncInput {
  slug: string;
  name: string;
  repo: RepoReport | null;
  pages: PageReport[];
  skipped: string[];
  deployments: { url: string; created: string; state: string }[] | null;
  since: string | null;   // önceki senkronizasyon (yeni commit/deployment tespiti için)
  now: Date;
}

const FEATURE = /^(add|feat|new|ekle|yeni|implement)\b/i;
const firstLine = (m: string) => m.split('\n')[0].trim();

export function sourcesSection(s: SyncInput): string {
  const lines: string[] = [];
  const date = s.now.toISOString().slice(0, 10);
  const newCommits = (s.repo?.commits ?? []).filter((c) => !s.since || c.date > s.since);
  const candidates = newCommits.filter((c) => FEATURE.test(firstLine(c.message)));

  if (s.repo) {
    lines.push(`- Ürün reposu \`${s.repo.repo}\` @ \`${s.repo.head_sha.slice(0, 7)}\` (${date}): ${s.repo.commits.length} commit okundu, ${s.repo.routes.length} sayfa: ${s.repo.routes.join(', ') || '—'}. \`.env*\` ve gizli dosyalar okunmadı.`);
    if (s.repo.package_description) lines.push(`- package.json açıklaması: "${s.repo.package_description}"`);
    lines.push(newCommits.length
      ? `- ${s.since ? 'Önceki senkronizasyondan beri' : 'Son'} ${newCommits.length} commit.`
      : '- Önceki senkronizasyondan beri yeni commit yok.');
    if (candidates.length) {
      lines.push('- **Doğrulanması gereken yeni özellik adayları** (onaylamadan önce canlıda olduğunu kontrol edin; doğrulanırsa "Doğrulanmış özellikler"e ekleyin):');
      for (const c of candidates.slice(0, 10)) lines.push(`  - ${firstLine(c.message)} (\`${c.sha.slice(0, 7)}\`, ${c.date.slice(0, 10)})`);
    }
  } else lines.push('- GitHub reposu tanımlı değil (Ürünler > ürün bilgileri).');

  for (const p of s.pages) lines.push(`- Canlı site ${p.url} (${date}): başlık "${p.title ?? '—'}"${p.description ? `, açıklama "${p.description}"` : ''}.`);
  for (const k of s.skipped) lines.push(`- Okunmadı: ${k}`);

  if (s.deployments?.length) {
    const latest = s.deployments[0];
    const isNew = !s.since || latest.created > s.since;
    lines.push(`- Vercel son deployment: ${latest.created.slice(0, 16).replace('T', ' ')} UTC (${latest.state})${isNew ? ' — yeni. Tek başına yeni özellik kanıtı değildir; repo ile doğrulayın.' : '.'}`);
  } else if (s.deployments) lines.push('- Vercel: deployment bulunamadı.');
  return lines.join('\n');
}

/** Onaylı brief'in "Kaynaklar" bölümünü günceller; diğer bölümlere dokunmaz. */
export function refreshSources(briefMd: string, s: SyncInput): string {
  const body = briefMd.replace(/^---\n[\s\S]*?\n---\n?/, '').trimEnd();
  const parts = body.split(/^(?=## )/m); // [başlık öncesi, "## X\n…", …]
  const section = `## Kaynaklar\n${sourcesSection(s)}\n`;
  const i = parts.findIndex((p) => p.startsWith('## Kaynaklar'));
  if (i >= 0) parts[i] = `${section}\n`;
  else parts.push(`\n${section}`);
  return `---\nproduct: ${s.slug}\n---\n${parts.join('').trimEnd()}\n`;
}

const MISSING = 'BİLGİ YOK — doldurun';

/** Brief'i olmayan ürün için iskelet: yalnızca kaynaklardan okunanlar yazılır, gerisi "BİLGİ YOK". */
export function skeletonBrief(s: SyncInput): string {
  const site = s.pages[0];
  return [
    '---', `product: ${s.slug}`, '---', '', `# ${s.name} — Brief`, '',
    '## Ürün', site?.description ?? s.repo?.package_description ?? MISSING, '',
    '## Hedef kitle', `- ${MISSING}`, '',
    '## Acı noktaları',
    ...[1, 2, 3, 4, 5].map((i) => `${i}. **${MISSING}** — açıklama. Hook: "…" → Özellik 1`), '',
    '## Doğrulanmış özellikler',
    'Yalnızca üründe çalıştığı doğrulanan özellikler. Aday başlıklar (sitede/başlıklarda görülen, doğrulanmadı):',
    ...(site?.headings.slice(0, 8).map((h) => `- (aday) ${h}`) ?? []),
    ...[1, 2, 3, 4, 5].map((i) => `${i}. **${MISSING}** — açıklama. İpucu: "…"`), '',
    '## Ton', MISSING, '',
    '## CTA', '"Canlı demoyu dene" — videoda ve caption\'da adres yazılmaz; izleyici profildeki bağlantıya yönlendirilir ("link profilde").',
    'Hedef: https://cal.com/furkan-alumert', '',
    '## Yasak konular',
    '- Kanıtlanmamış "%X artış" veya gelir vaadi.', '- Rakip adı anmak veya kötülemek.', '- Gerçek müşteri verisi.', '- Videoda veya caption\'da web adresi.', '',
    '## Doğrulanmamış (videoda söylenmeyecek)', `- **${MISSING}**`, '',
    `## Kaynaklar\n${sourcesSection(s)}`, '',
  ].join('\n');
}
