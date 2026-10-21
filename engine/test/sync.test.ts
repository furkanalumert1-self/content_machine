import { describe, expect, it } from 'vitest';
import { commitsSince, inspectRepo, isForbiddenPath, LeakSuspectedError, routesFromTree } from '../src/sync/github.ts';
import { extractPage, robotsAllows } from '../src/sync/site.ts';

describe('isForbiddenPath', () => {
  it.each(['.env', '.env.local', '.env.example', 'apps/web/.env.production', 'certs/server.pem', 'id_rsa', 'config/secrets.json', '.npmrc'])(
    '%s yasak', (p) => expect(isForbiddenPath(p)).toBe(true),
  );
  it.each(['README.md', 'package.json', 'app/(app)/sms/page.tsx', 'docs/setup.md'])('%s serbest', (p) =>
    expect(isForbiddenPath(p)).toBe(false),
  );
});

describe('routesFromTree', () => {
  it('Next.js sayfalarını URL yollarına çevirir, (grup) klasörlerini atlar', () => {
    expect(routesFromTree(['app/(marketing)/page.tsx', 'app/(app)/sms/page.tsx', 'app/f/[id]/page.tsx', 'app/api/auth/login/route.ts', 'lib/x.ts']))
      .toEqual(['/', '/f/[id]', '/sms']);
  });
});

describe('commitsSince', () => {
  it('yalnızca son N günü döndürür', () => {
    const c = [{ sha: '1', date: '2026-10-20T00:00:00Z', message: 'a' }, { sha: '2', date: '2026-09-09T00:00:00Z', message: 'b' }];
    expect(commitsSince(c, 14, new Date('2026-10-22T00:00:00Z')).map((x) => x.sha)).toEqual(['1']);
  });
});

describe('inspectRepo (sahte GitHub)', () => {
  const fake = (files: Record<string, string>, commitMsg = 'Add segments') => {
    const requested: string[] = [];
    const fetcher = async (url: string) => {
      requested.push(url);
      const path = url.replace('https://api.github.com/repos/o/r', '');
      const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
      if (path === '') return json({ description: 'desc', default_branch: 'main' });
      if (path.startsWith('/commits')) return json([{ sha: 's1', commit: { message: `${commitMsg}\n\nCo-Authored-By: X`, author: { date: '2026-10-20T00:00:00Z' } } }]);
      if (path.startsWith('/git/trees')) return json({ tree: [...Object.keys(files), '.env.local'].map((p) => ({ path: p, type: 'blob' })) });
      if (path.startsWith('/releases')) return json([]);
      const file = decodeURIComponent(path.replace('/contents/', ''));
      return file in files ? new Response(files[file], { status: 200 }) : new Response('', { status: 404 });
    };
    return { fetcher: fetcher as typeof fetch, requested };
  };

  it('rapor çıkarır, .env dosyasını hiç istemez, imza satırlarını atar', async () => {
    const { fetcher, requested } = fake({ 'package.json': '{"description":"retention"}', 'README.md': '# Ürün', 'app/(app)/sms/page.tsx': '' });
    const r = await inspectRepo('o/r', undefined, fetcher);
    expect(r.package_description).toBe('retention');
    expect(r.routes).toEqual(['/sms']);
    expect(r.commits[0].message).toBe('Add segments');
    expect(requested.some((u) => u.includes('.env'))).toBe(false);
  });

  it('README içinde gizli anahtar görürse durur', async () => {
    const { fetcher } = fake({ 'package.json': '{}', 'README.md': `key: ghp_${'a'.repeat(36)}` });
    await expect(inspectRepo('o/r', undefined, fetcher)).rejects.toBeInstanceOf(LeakSuspectedError);
  });
});

describe('robotsAllows', () => {
  const robots = 'User-agent: *\nDisallow: /dashboard\nAllow: /dashboard/public\n\nUser-agent: badbot\nDisallow: /';
  it('kurallara uyar', () => {
    expect(robotsAllows(robots, '/')).toBe(true);
    expect(robotsAllows(robots, '/dashboard')).toBe(false);
    expect(robotsAllows(robots, '/dashboard/public')).toBe(true);
    expect(robotsAllows(robots, '/', 'badbot')).toBe(false);
    expect(robotsAllows(null, '/anything')).toBe(true);
  });
});

describe('extractPage', () => {
  it('başlık, açıklama ve başlıkları çıkarır; Next.js 404 başlığını atlar', () => {
    const html = `<title>404: This page could not be found.</title><title>Callypso Engage — Segmentle</title>
      <meta name="description" content="LTV&#x27;yi büyüt"/><h1 class="x">Müşterini <span>segmentle</span></h1><h2>SSS</h2>`;
    expect(extractPage('https://x', html)).toEqual({
      url: 'https://x', title: 'Callypso Engage — Segmentle', description: "LTV'yi büyüt", headings: ['Müşterini segmentle', 'SSS'], theme_color: null,
    });
  });
});
