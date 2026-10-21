import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBrief } from '../src/brief/brief.ts';
import { checkClaims } from '../src/content/claims.ts';
import { generateIdeas } from '../src/ideas/generate.ts';
import { analyzePerformance } from '../src/ideas/performance.ts';
import { selectIdea } from '../src/ideas/select.ts';
import type { Idea, VideoPerformance } from '../src/ideas/types.ts';

const brief = parseBrief(readFileSync(join(import.meta.dirname, '../../config/products/callypso-engage.md'), 'utf8'));
const noData = analyzePerformance([]);
const now = new Date('2026-10-22T09:00:00Z');

describe('generateIdeas', () => {
  const result = generateIdeas({ brief, commits: [], existing: [], performance: noData, now });

  it('15–20 fikir üretir, hepsinde zorunlu alanlar ve 0–100 puan var', () => {
    expect(result.ideas.length).toBeGreaterThanOrEqual(15);
    expect(result.ideas.length).toBeLessThanOrEqual(20);
    for (const i of result.ideas) {
      expect(i.idea && i.hook && i.why && i.source).toBeTruthy();
      expect(i.score).toBeGreaterThanOrEqual(0);
      expect(i.score).toBeLessThanOrEqual(100);
    }
  });

  it('beş içerik türünün hepsi var ve keşif fikirleri işaretli', () => {
    expect(new Set(result.ideas.map((i) => i.content_type)).size).toBe(5);
    expect(result.ideas.filter((i) => i.is_exploration).length).toBe(3);
  });

  it('hiçbir fikirde yasaklı iddia yok', () => {
    for (const i of result.ideas) expect(checkClaims(`${i.idea} ${i.hook}`)).toEqual([]);
  });

  it('eksik kaynakları dürüstçe not eder', () => {
    const notes = result.notes.join('\n');
    expect(notes).toMatch(/yeni özellik commit'i yok/);
    expect(notes).toMatch(/Trend kaynağı yapılandırılmadı/);
    expect(notes).toMatch(/Veri yetersiz/);
  });

  it('var olan fikirleri tekrar eklemez', () => {
    const again = generateIdeas({ brief, commits: [], existing: result.ideas, performance: noData });
    expect(again.ideas.filter((i) => result.ideas.some((r) => r.idea === i.idea))).toEqual([]);
  });

  it('yeni özellik commit\'i duyuru fikri olur, düzeltme commit\'i olmaz', () => {
    const r = generateIdeas({
      brief, existing: [], performance: noData,
      commits: [
        { sha: 'a'.repeat(40), date: '2026-10-20T10:00:00Z', message: 'Add VIP segment export' },
        { sha: 'b'.repeat(40), date: '2026-10-19T10:00:00Z', message: 'Fix typo in footer' },
      ],
    });
    const changelog = r.ideas.filter((i) => i.source === 'changelog');
    expect(changelog).toHaveLength(1);
    expect(changelog[0].idea).toContain('VIP segment export');
    expect(changelog[0].score).toBeGreaterThan(r.ideas.find((i) => i.source === 'audience')!.score);
  });

  it('yasaklı ifade içeren commit elenir ve not düşülür', () => {
    const r = generateIdeas({ brief, existing: [], performance: noData,
      commits: [{ sha: 'c'.repeat(40), date: '2026-10-20T10:00:00Z', message: 'Add Mailchimp import' }] });
    expect(r.ideas.some((i) => i.source === 'changelog')).toBe(false);
    expect(r.notes.join('\n')).toMatch(/Elendi.*Rakip adı/);
  });
});

const idea = (id: string, score: number, extra: Partial<Idea> = {}): Idea => ({
  id, product_id: 'p', idea: id, hook: id, content_type: 'ipucu', source: 'audience', source_ref: null,
  score, is_exploration: false, used: false, last_used_at: null, why: '', ...extra,
});

describe('selectIdea', () => {
  const pool = [
    idea('a', 90), idea('b', 80), idea('x', 60, { is_exploration: true }),
    ...Array.from({ length: 10 }, (_, i) => idea(`f${i}`, 50)),
  ];

  it('normal günde kullanılmamış en yüksek puanlı keşif olmayan fikri seçer', () => {
    expect(selectIdea(pool, [false, true], now).idea?.id).toBe('a');
  });

  it('son 3 gün keşif yoksa (dört günde bir) keşif fikri seçer', () => {
    const s = selectIdea(pool, [false, false, false], now);
    expect(s.idea?.id).toBe('x');
    expect(s.reason).toMatch(/Keşif günü/);
  });

  it('60 gün içinde kullanılan fikri tekrar seçmez, 60 gün sonra seçer', () => {
    const used59 = [idea('a', 90, { used: true, last_used_at: '2026-08-24T09:00:00Z' }), idea('b', 80)];
    expect(selectIdea(used59, [], now).idea?.id).toBe('b');
    const used60 = [idea('a', 90, { used: true, last_used_at: '2026-08-23T09:00:00Z' }), idea('b', 80)];
    expect(selectIdea(used60, [], now).idea?.id).toBe('a');
  });

  it('kullanılabilir fikir 10\'un altına inerse acil araştırma ister', () => {
    expect(selectIdea(pool, [], now).needsEmergencyResearch).toBe(false); // 13 → 12 kalır
    expect(selectIdea(pool.slice(0, 10), [], now).needsEmergencyResearch).toBe(true); // 10 → 9 kalır
  });

  it('fikir yoksa null döner', () => {
    expect(selectIdea([], [], now)).toMatchObject({ idea: null, needsEmergencyResearch: true });
  });
});

describe('analyzePerformance', () => {
  const v = (i: number, type: VideoPerformance['content_type'], views: number | null): VideoPerformance => ({
    video_id: `v${i}`, idea_id: null, content_type: type, style: 'dark-keynote', publish_hour: 12 + (i % 3), views, likes: 0, saved: 0,
  });

  it('10 videodan az veride öğrenmez ve bunu söyler', () => {
    const r = analyzePerformance(Array.from({ length: 9 }, (_, i) => v(i, 'ipucu', 100)));
    expect(r.enough).toBe(false);
    expect(r.typeAdjust).toEqual({});
  });

  it('metriği eksik videoyu hesaba katmaz (uydurmaz)', () => {
    const r = analyzePerformance([...Array.from({ length: 9 }, (_, i) => v(i, 'ipucu', 100)), v(9, 'ipucu', null)]);
    expect(r.enough).toBe(false);
  });

  it('iyi giden türe artı, kötü gidene eksi puan verir (±15 sınırında)', () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, i) => v(i, 'mini_demo', 1000)),
      ...Array.from({ length: 5 }, (_, i) => v(i + 5, 'mit_curutme', 100)),
    ];
    const r = analyzePerformance(rows);
    expect(r.enough).toBe(true);
    expect(r.typeAdjust.mini_demo).toBe(15);
    expect(r.typeAdjust.mit_curutme).toBe(-15);
    expect(r.note).toMatch(/En iyi 5: içerik türü mini_demo \(5\/5\)/);
  });
});
