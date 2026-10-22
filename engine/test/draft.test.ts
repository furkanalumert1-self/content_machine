import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hashBody, parseBrief } from '../src/brief/brief.ts';
import { refreshSources, skeletonBrief, type SyncInput } from '../src/brief/draft.ts';

const approved = readFileSync(join(import.meta.dirname, '../../config/products/callypso-engage.md'), 'utf8');
const input = (extra: Partial<SyncInput> = {}): SyncInput => ({
  slug: 'callypso-engage', name: 'Callypso Engage', now: new Date('2026-10-22T08:00:00Z'), since: '2026-10-01T00:00:00Z', skipped: [],
  repo: { repo: 'o/r', head_sha: 'abcdef1234', description: null, package_description: null, readme_excerpt: null, releases: [], docs: [], routes: ['/', '/sms'],
    commits: [{ sha: 'c1'.padEnd(40, '0'), date: '2026-10-20T10:00:00Z', message: 'Add VIP export\n\nbody' }, { sha: 'c2'.padEnd(40, '0'), date: '2026-10-19T10:00:00Z', message: 'Fix typo' }, { sha: 'c3'.padEnd(40, '0'), date: '2026-09-01T10:00:00Z', message: 'Add old thing' }] },
  pages: [{ url: 'https://x/', title: 'Callypso', description: 'Retention', headings: ['Segmentle'], theme_color: null }],
  deployments: [{ url: 'x.vercel.app', created: '2026-10-21T09:00:00Z', state: 'READY' }],
  ...extra,
});

describe('refreshSources', () => {
  const draft = refreshSources(approved, input());
  it('yalnızca Kaynaklar bölümünü değiştirir; brief hâlâ geçerli', () => {
    const before = parseBrief(approved);
    const after = parseBrief(draft);
    expect(after.pains).toEqual(before.pains);
    expect(after.features).toEqual(before.features);
    expect(after.sections['Kaynaklar']).not.toEqual(before.sections['Kaynaklar']);
    expect(after.status).toBe('taslak'); // onay bilgisi taşınmaz
  });
  it('yalnızca önceki senkronizasyondan sonraki özellik commit\'lerini aday yapar; deployment kanıt sayılmaz', () => {
    expect(draft).toMatch(/Doğrulanması gereken yeni özellik adayları/);
    expect(draft).toMatch(/Add VIP export/);
    expect(draft).not.toMatch(/Fix typo \(/);
    expect(draft).not.toMatch(/Add old thing/);
    expect(draft).toMatch(/Tek başına yeni özellik kanıtı değildir/);
  });
  it('aynı girdiyle tekrar senkronizasyon aynı metni üretir (gereksiz sürüm açılmaz)', () => {
    expect(hashBody(refreshSources(draft, input()))).toBe(hashBody(draft));
  });
});

describe('skeletonBrief', () => {
  it('uydurmaz: eksikler BİLGİ YOK; onaylanmaya çalışılırsa doğrulama hatası verir', () => {
    const sk = skeletonBrief(input({ slug: 'inboxly', name: 'Inboxly' }));
    expect(sk).toMatch(/BİLGİ YOK — doldurun/);
    expect(sk).toMatch(/\(aday\) Segmentle/);
    expect(sk).not.toMatch(/vercel\.app/);
    expect(() => parseBrief(sk)).not.toThrow(); // biçim geçerli…
    expect(parseBrief(sk).pains[0].title).toMatch(/BİLGİ YOK/); // …ama içerik doldurulmalı (panel bunu engeller)
  });
});
