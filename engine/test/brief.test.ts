import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { approveBriefMarkdown, BriefError, isApproved, parseBrief } from '../src/brief/brief.ts';

const real = readFileSync(join(import.meta.dirname, '../../config/products/callypso-engage.md'), 'utf8');

describe('Callypso Engage brief', () => {
  it('geçerli: 5 acı noktası, 5 özellik, CTA ve yasaklar okunuyor', () => {
    const b = parseBrief(real);
    expect(b.product).toBe('callypso-engage');
    expect(b.pains).toHaveLength(5);
    expect(b.features).toHaveLength(5);
    expect(b.myths.length).toBeGreaterThanOrEqual(3);
    expect(b.cta).toBe('Canlı demoyu dene');
    expect(b.ctaUrl).toBe('https://cal.com/furkan-alumert');
    expect(b.forbidden.join(' ')).toMatch(/örnek veri/);
    expect(b.unverified.length).toBeGreaterThanOrEqual(4);
  });

  it('onay durumu tutarlı: dosya "onaylı" diyorsa özet metinle eşleşmeli', () => {
    const b = parseBrief(real);
    if (b.status === 'onaylı') expect(isApproved(b)).toBe(true);
    else expect(b.approvedHash).toBeNull();
  });

  it('15 ek ipucu var ve hepsi geçerli bir özelliğe bağlı', () => {
    const b = parseBrief(real);
    expect(b.extraTips).toHaveLength(15);
    for (const t of b.extraTips) expect(b.features[t.featureIndex]).toBeDefined();
    expect(b.myths).toHaveLength(10);
  });
});

describe('onay akışı', () => {
  it('onay o anki metne bağlı; metin değişince onay düşer', () => {
    const approved = approveBriefMarkdown(real, new Date('2026-10-22T09:00:00Z'));
    expect(isApproved(parseBrief(approved))).toBe(true);
    const edited = approved.replace('Sade, net, Türkçe.', 'Sade, net ve samimi Türkçe.');
    const b = parseBrief(edited);
    expect(b.status).toBe('onaylı');
    expect(isApproved(b)).toBe(false);
  });

  it('boşluk farkı onayı bozmaz', () => {
    const approved = approveBriefMarkdown(real);
    expect(isApproved(parseBrief(approved.replace(/\n$/, '\n\n   ')))).toBe(true);
  });
});

describe('doğrulama', () => {
  it('eksik bölüm ve yanlış sayı Türkçe hata verir', () => {
    const broken = real.replace(/## CTA[\s\S]*?## Yasak/, '## Yasak').replace(/^5\. \*\*İzin takibi[^\n]*\n/m, '');
    try {
      parseBrief(broken);
      throw new Error('hata bekleniyordu');
    } catch (e) {
      expect(e).toBeInstanceOf(BriefError);
      const p = (e as BriefError).problems.join('\n');
      expect(p).toMatch(/"CTA" bölümü eksik/);
      expect(p).toMatch(/Tam 5 acı noktası/);
    }
  });
});
