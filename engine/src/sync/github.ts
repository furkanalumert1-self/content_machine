// Ürün reposunu GitHub REST API ile SALT OKUNUR inceler.
// Gizli dosyalar asla istenmez; dönen metinler de maskeleme ve sızıntı kontrolünden geçer.

import { redact } from '../lib/redact.ts';
import type { Commit } from '../ideas/types.ts';

const FORBIDDEN = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)\.(npmrc|netrc|pgpass)$/i,
  /\.(pem|key|p12|pfx|keystore|jks)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)/i,
  /(secret|credential|password|passwd|token)s?[^/]*$/i,
];

export function isForbiddenPath(path: string): boolean {
  return FORBIDDEN.some((re) => re.test(path));
}

export class LeakSuspectedError extends Error {}

/** Okunan içerikte gizli anahtar kalıbı varsa işi durdur (bildirim üst katmanda). */
export function assertNoSecrets(path: string, text: string) {
  if (redact(text, {}) !== text) {
    throw new LeakSuspectedError(`Olası gizli anahtar sızıntısı: ${path}. İşlem durduruldu; içerik kaydedilmedi.`);
  }
}

export function routesFromTree(paths: string[]): string[] {
  return paths
    .filter((p) => /^(src\/)?app\/.*page\.(t|j)sx?$/.test(p))
    .map((p) =>
      '/' +
      p
        .replace(/^(src\/)?app\//, '')
        .replace(/\/?page\.(t|j)sx?$/, '')
        .split('/')
        .filter((seg) => !/^\(.*\)$/.test(seg)) // (app), (marketing) gibi gruplar URL'de yok
        .join('/'),
    )
    .map((r) => (r === '/' ? r : r.replace(/\/$/, '')))
    .sort();
}

export interface RepoReport {
  repo: string;
  head_sha: string;
  description: string | null;
  package_description: string | null;
  readme_excerpt: string | null;
  commits: Commit[];
  releases: { tag: string; name: string; date: string }[];
  docs: string[];
  routes: string[];
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function inspectRepo(repo: string, token: string | undefined, fetcher: Fetcher = fetch): Promise<RepoReport> {
  const api = async <T>(path: string, accept = 'application/vnd.github+json'): Promise<T> => {
    const res = await fetcher(`https://api.github.com/repos/${repo}${path}`, {
      headers: { Accept: accept, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'User-Agent': 'content-machine' },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
    return accept.includes('raw') ? ((await res.text()) as T) : ((await res.json()) as T);
  };
  const raw = async (path: string) => {
    if (isForbiddenPath(path)) throw new Error(`Yasaklı dosya istenmeye çalışıldı: ${path}`);
    try {
      const text = await api<string>(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, 'application/vnd.github.raw+json');
      assertNoSecrets(path, text);
      return text;
    } catch (e) {
      if (e instanceof LeakSuspectedError) throw e;
      return null;
    }
  };

  const meta = await api<{ description: string | null; default_branch: string }>('');
  const commitsRaw = await api<{ sha: string; commit: { message: string; author: { date: string } } }[]>('/commits?per_page=30');
  const tree = await api<{ tree: { path: string; type: string }[] }>(`/git/trees/${meta.default_branch}?recursive=1`);
  const releases = await api<{ tag_name: string; name: string; published_at: string }[]>('/releases?per_page=10').catch(() => []);

  const paths = tree.tree.filter((t) => t.type === 'blob').map((t) => t.path).filter((p) => !isForbiddenPath(p));
  const pkg = await raw('package.json');
  const readme = await raw('README.md');

  const commits = commitsRaw.map((c) => {
    const message = c.commit.message.split('\n').filter((l) => !/^(Co-Authored-By|Claude-Session|Signed-off-by):/i.test(l)).join('\n').trim();
    assertNoSecrets(`commit ${c.sha}`, message);
    return { sha: c.sha, date: c.commit.author.date, message };
  });

  return {
    repo,
    head_sha: commitsRaw[0]?.sha ?? '',
    description: meta.description,
    package_description: pkg ? (JSON.parse(pkg).description || null) : null,
    readme_excerpt: readme ? readme.slice(0, 4000) : null,
    commits,
    releases: releases.map((r) => ({ tag: r.tag_name, name: r.name, date: r.published_at })),
    docs: paths.filter((p) => p.startsWith('docs/')),
    routes: routesFromTree(paths),
  };
}

/** Yerel bir klondan aynı raporu çıkarır (ağ yoksa veya test için). Aynı yasaklı dosya ve sızıntı kuralları geçerli. */
export async function inspectLocalClone(dir: string, repo: string): Promise<RepoReport> {
  const { execFileSync } = await import('node:child_process');
  const { readFileSync, existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const git = (...args: string[]) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  const paths = git('ls-files').split('\n').filter(Boolean).filter((p) => !isForbiddenPath(p));
  const read = (p: string) => {
    if (isForbiddenPath(p) || !existsSync(join(dir, p))) return null;
    const text = readFileSync(join(dir, p), 'utf8');
    assertNoSecrets(p, text);
    return text;
  };
  const commits = git('log', '-30', '--format=%H%x1f%aI%x1f%B%x1e')
    .split('\x1e').map((s) => s.trim()).filter(Boolean)
    .map((entry) => {
      const [sha, date, body] = entry.split('\x1f');
      const message = body.split('\n').filter((l) => !/^(Co-Authored-By|Claude-Session|Signed-off-by):/i.test(l)).join('\n').trim();
      assertNoSecrets(`commit ${sha}`, message);
      return { sha, date, message };
    });
  const pkg = read('package.json');
  const readme = read('README.md');
  return {
    repo, head_sha: commits[0]?.sha ?? '', description: null,
    package_description: pkg ? (JSON.parse(pkg).description || null) : null,
    readme_excerpt: readme?.slice(0, 4000) ?? null, commits, releases: [],
    docs: paths.filter((p) => p.startsWith('docs/')), routes: routesFromTree(paths),
  };
}

export function commitsSince(commits: Commit[], days: number, now = new Date()): Commit[] {
  const cutoff = now.getTime() - days * 86_400_000;
  return commits.filter((c) => new Date(c.date).getTime() >= cutoff);
}
