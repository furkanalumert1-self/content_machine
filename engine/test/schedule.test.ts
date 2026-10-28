import { describe, expect, it } from 'vitest';
import { averageByHour, dueCheckpoints, engagementScore, onlineFollowersByLocalHour, parseInsights, toRow } from '../src/metrics/insights.ts';
import { candidateSlots, chooseSlot, localParts, localToUtc, type ChooseInput, type PastVideo } from '../src/schedule/slots.ts';

const TZ = 'Europe/Istanbul';
const WINDOWS = [{ start: '12:00', end: '14:00' }, { start: '19:00', end: '22:00' }];
const at = (local: string) => localToUtc(local.slice(0, 10), local.slice(11, 16), TZ);
const base = (now: string, extra: Partial<ChooseInput> = {}): ChooseInput => ({ windows: WINDOWS, timezone: TZ, now: at(now), history: [], recentPlanned: [], ...extra });

describe('saat aralıkları', () => {
  it('12:00–14:00 ve 19:00–22:00 → 30 dakikalık 10 aday', () => {
    expect(candidateSlots(WINDOWS)).toEqual(['12:00', '12:30', '13:00', '13:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']);
  });
  it('İstanbul saati ↔ UTC', () => {
    expect(localToUtc('2026-10-22', '12:00', TZ).toISOString()).toBe('2026-10-22T09:00:00.000Z');
    expect(localParts(new Date('2026-10-22T21:30:00Z'), TZ)).toEqual({ date: '2026-10-23', minute: 30 });
  });
});

describe('chooseSlot — az veri (keşif)', () => {
  it('her gün farklı bir saat dener; 10 günde 10 adayın hepsi denenir', () => {
    const planned: Date[] = [];
    const chosen = new Set<string>();
    for (let d = 0; d < 10; d++) {
      const day = new Date(Date.UTC(2026, 9, 22 + d)).toISOString().slice(0, 10);
      const c = chooseSlot(base(`${day}T09:00`, { recentPlanned: planned }));
      expect(c.mode).toBe('keşif');
      expect(c.reason).toMatch(/kanıtlanmış en iyi saat değildir/);
      chosen.add(c.slot);
      planned.push(c.publishAt);
    }
    expect(chosen.size).toBe(10);
  });

  it('render ve onay için en az 45 dk önceden seçer', () => {
    const c = chooseSlot(base('2026-10-22T11:30'));
    expect(c.publishAt.getTime() - at('2026-10-22T11:30').getTime()).toBeGreaterThanOrEqual(45 * 60000);
  });

  it('günün aralıkları geçtiyse ertesi güne planlar', () => {
    const c = chooseSlot(base('2026-10-22T21:50'));
    expect(localParts(c.publishAt, TZ).date).toBe('2026-10-23');
  });

  it('takipçi aktifliği varsa eşitlikte en aktif saati seçer ve gerekçede belirtir', () => {
    const online = Array(24).fill(10);
    online[20] = 500;
    const c = chooseSlot(base('2026-10-22T09:00', { onlineByHour: online }));
    expect(c.slot.startsWith('20:')).toBe(true);
    expect(c.reason).toMatch(/500 takipçi çevrimiçi/);
  });

  it('veri yoksa bunu söyler', () => {
    expect(chooseSlot(base('2026-10-22T09:00')).reason).toMatch(/Takipçi aktif saat verisi yok/);
  });
});

describe('chooseSlot — yeterli veri', () => {
  const hist: PastVideo[] = [];
  const add = (local: string, score: number) => hist.push({ publishedAt: at(local), score });
  ['10-01', '10-03', '10-05'].forEach((d) => add(`2026-${d}T19:00`, 900));
  ['10-02', '10-04', '10-06'].forEach((d) => add(`2026-${d}T12:00`, 300));
  ['10-07', '10-08'].forEach((d) => add(`2026-${d}T21:00`, 500));
  hist.push({ publishedAt: at('2026-10-09T13:00'), score: null }); // metriği eksik video sayılmaz

  it('keşif günü değilse en yüksek ortalamalı saati seçer, örnek sayısını ve belirsizliği yazar', () => {
    // 2026-10-23: dayIndex % 4 !== 0
    const c = chooseSlot(base('2026-10-23T09:00', { history: hist }));
    expect(c).toMatchObject({ slot: '19:00', mode: 'kullan' });
    expect(c.reason).toMatch(/n=3/);
    expect(c.reason).toMatch(/kesin değildir/);
  });

  it('4 günde bir keşif yapar (az denenen saat)', () => {
    const c = chooseSlot(base('2026-10-22T09:00', { history: hist })); // dayIndex % 4 === 0
    expect(c.mode).toBe('keşif');
    expect(['12:00', '19:00', '21:00']).not.toContain(c.slot);
  });

  it('toplam ölçülmüş video 8\'den azsa yine keşif', () => {
    expect(chooseSlot(base('2026-10-23T09:00', { history: hist.slice(0, 5) })).mode).toBe('keşif');
  });
});

describe('metrikler', () => {
  it('values ve total_value biçimlerini okur; bilinmeyen/sayı olmayanları atar', () => {
    expect(parseInsights({ data: [
      { name: 'views', values: [{ value: 120 }] }, { name: 'likes', total_value: { value: 7 } },
      { name: 'saved', values: [{ value: 'x' }] }, { name: 'impressions', values: [{ value: 5 }] },
    ] })).toEqual({ views: 120, likes: 7 });
  });

  it('eksik metrik 0 değil NULL olur', () => {
    const row = toRow({ views: 10 });
    expect(row.views).toBe(10);
    expect(row.saved).toBeNull();
    expect(row.avg_watch_time_raw).toBeNull();
  });

  it('izlenme yoksa etkileşim puanı yok', () => {
    expect(engagementScore({ views: null, likes: 5, saved: 1 })).toBeNull();
    expect(engagementScore({ views: 100, likes: 2, saved: 1 })).toBe(125);
  });

  it.each([
    [10, [], []], [25, [], [24]], [25, [24], []], [73, [], [72]], [73, [24], [72]], [73, [24, 72], []], [15 * 24, [], []],
  ] as [number, number[], number[]][])('yayından %i saat sonra (alınan %j) → %j', (h, done, expected) => {
    const pub = new Date('2026-10-01T10:00:00Z');
    expect(dueCheckpoints(pub, done, new Date(pub.getTime() + h * 3_600_000))).toEqual(expected);
  });

  it('online_followers saatlerini UTC−7\'den İstanbul (UTC+3) saatine çevirir', () => {
    const days = onlineFollowersByLocalHour({ data: [{ values: [{ value: { '0': 40, '10': 90 }, end_time: '2026-10-21T07:00:00+0000' }, { value: {} }] }] }, -7, 3);
    expect(days).toHaveLength(1);
    expect(days[0].hours[10]).toBe(40); // 00:00 (UTC−7) = 10:00 İstanbul
    expect(days[0].hours[20]).toBe(90);
    expect(averageByHour(days)![10]).toBe(40);
    expect(averageByHour([])).toBeNull();
  });
});

describe('chooseSlot — günde iki video (öğleden sonra + akşam)', () => {
  const W2 = [{ start: '13:00', end: '16:00' }, { start: '19:00', end: '21:00' }];
  const plan2 = (now: string, occupied: Date[] = []) => {
    const first = chooseSlot({ ...base(now), windows: W2, occupied, minLeadMinutes: 240 });
    const second = chooseSlot({ ...base(now), windows: W2, occupied: [...occupied, first.publishAt], minLeadMinutes: 240 });
    return [first, second].map((c) => localParts(c.publishAt, TZ));
  };

  it('08:41 planlaması: aynı gün öğleden sonra + akşam (onay için en az 4 saat)', () => {
    const [a, b] = plan2('2026-10-28T08:41');
    expect([a.date, a.minute >= 13 * 60, a.minute < 16 * 60]).toEqual(['2026-10-28', true, true]);
    expect([b.date, b.minute >= 19 * 60, b.minute < 21 * 60]).toEqual(['2026-10-28', true, true]);
  });

  it('öğleden sonra doluysa aynı aralığa ikinci video düşmez; geç saatte plan ertesi güne kayar', () => {
    const [a] = plan2('2026-10-29T08:41', [at('2026-10-29T14:00')]);
    expect([a.date, a.minute >= 19 * 60]).toEqual(['2026-10-29', true]);
    const [late] = plan2('2026-10-28T17:00');
    expect([late.date, late.minute >= 13 * 60, late.minute < 16 * 60]).toEqual(['2026-10-29', true, true]);
  });

  it('elle istenen video (doluluk yok): en yakın uygun saat', () => {
    const c = chooseSlot({ ...base('2026-10-28T08:41'), windows: W2 });
    expect(localParts(c.publishAt, TZ).date).toBe('2026-10-28');
    expect(localParts(c.publishAt, TZ).minute).toBeGreaterThanOrEqual(13 * 60);
  });
});
