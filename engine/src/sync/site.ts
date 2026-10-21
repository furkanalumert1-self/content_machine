// Canlı sitenin herkese açık sayfalarını robots.txt'e uyarak okur. Giriş gerektiren sayfalar okunmaz.

const UA = 'content-machine-brief-bot';

export function robotsAllows(robotsTxt: string | null, path: string, ua = UA): boolean {
  if (!robotsTxt) return true;
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  for (const rawLine of robotsTxt.split('\n')) {
    const line = rawLine.replace(/#.*/, '').trim();
    const m = line.match(/^(user-agent|disallow|allow):\s*(.*)$/i);
    if (!m) continue;
    const [, key, value] = m;
    if (key.toLowerCase() === 'user-agent') {
      if (!current || current.disallow.length || current.allow.length) groups.push((current = { agents: [], disallow: [], allow: [] }));
      current.agents.push(value.toLowerCase());
    } else if (current && value) {
      (key.toLowerCase() === 'allow' ? current.allow : current.disallow).push(value);
    }
  }
  const mine = groups.find((g) => g.agents.includes(ua.toLowerCase())) ?? groups.find((g) => g.agents.includes('*'));
  if (!mine) return true;
  const longest = (rules: string[]) => Math.max(-1, ...rules.filter((r) => path.startsWith(r)).map((r) => r.length));
  return longest(mine.allow) >= longest(mine.disallow);
}

export interface PageReport {
  url: string;
  title: string | null;
  description: string | null;
  headings: string[];
  theme_color: string | null;
}

const decode = (s: string) =>
  s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = (s: string) => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

export function extractPage(url: string, html: string): PageReport {
  const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => decode(m[1])).filter((t) => !/^404/.test(t));
  return {
    url,
    title: titles[0] ?? null,
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1].replace(/&#x27;/g, "'") ?? null,
    headings: [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g)].map((m) => strip(m[1])).filter(Boolean).slice(0, 40),
    theme_color: html.match(/<meta name="theme-color" content="([^"]*)"/)?.[1] ?? null,
  };
}

export async function inspectSite(siteUrl: string, paths = ['/'], fetcher = fetch): Promise<{ pages: PageReport[]; skipped: string[] }> {
  const base = new URL(siteUrl);
  const robotsRes = await fetcher(new URL('/robots.txt', base), { headers: { 'User-Agent': UA } });
  const robots = robotsRes.ok ? await robotsRes.text() : null;
  const pages: PageReport[] = [];
  const skipped: string[] = [];
  for (const p of paths) {
    if (!robotsAllows(robots, p)) { skipped.push(`${p} (robots.txt izin vermiyor)`); continue; }
    const res = await fetcher(new URL(p, base), { headers: { 'User-Agent': UA }, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) { skipped.push(`${p} (yönlendirme — giriş gerektirebilir, okunmadı)`); continue; }
    if (!res.ok) { skipped.push(`${p} (HTTP ${res.status})`); continue; }
    pages.push(extractPage(String(new URL(p, base)), await res.text()));
  }
  return { pages, skipped };
}
