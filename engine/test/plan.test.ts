import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBrief } from '../src/brief/brief.ts';
import { checkClaims } from '../src/content/claims.ts';
import { generateIdeas } from '../src/ideas/generate.ts';
import { analyzePerformance } from '../src/ideas/performance.ts';
import { CONTENT_TYPES, type Idea } from '../src/ideas/types.ts';
import { planDay } from '../src/plan/planner.ts';
import { chooseContentType, chooseProduct, chooseStyle, type RecentVideo } from '../src/plan/rotation.ts';
import { buildCaption, buildHashtags, buildScript, chipsOf, contentSentences, lineify, MAX_LINE_CHARS, validatePlan } from '../src/plan/script.ts';
import { startOfLocalDay, tzOffsetMinutes } from '../src/plan/time.ts';

const brief = parseBrief(readFileSync(join(import.meta.dirname, '../../config/products/callypso-engage.md'), 'utf8'));
const ideas: Idea[] = generateIdeas({ brief, commits: [], existing: [], performance: analyzePerformance([]) }).ideas
  .map((d, i) => ({ ...d, id: `i${String(i).padStart(2, '0')}`, product_id: 'p', used: false, last_used_at: null }));
const rv = (type: RecentVideo['content_type'], extra: Partial<RecentVideo> = {}): RecentVideo => ({
  product_id: 'p', content_type: type, style: 'dark-keynote', created_at: '2026-10-20T00:00:00Z', ...extra,
});

describe('rotation', () => {
  it('MVP: tek aktif ürün her gün seçilir (üst üste kuralı uygulanmaz)', () => {
    expect(chooseProduct(['callypso'], [rv('ipucu', { product_id: 'callypso' })], false).id).toBe('callypso');
  });
  it('çok ürünlü aşamada dünkü ürün seçilmez', () => {
    const recent = [rv('ipucu', { product_id: 'a' }), rv('ipucu', { product_id: 'b' })];
    expect(chooseProduct(['a', 'b', 'c'], recent, true).id).toBe('c');
    expect(chooseProduct(['a', 'b'], recent, true).id).toBe('b');
  });
  it('aktif ürün yoksa planlama yapılmaz', () => {
    expect(chooseProduct([], [], false).id).toBeNull();
  });
  it('içerik türünü en uzun süredir kullanılmayandan seçer', () => {
    expect(chooseContentType([]).type).toBe('problem_cozum');
    expect(chooseContentType([rv('problem_cozum')]).type).toBe('ipucu');
    expect(chooseContentType([rv('ipucu'), rv('mini_demo'), rv('once_sonra'), rv('mit_curutme'), rv('problem_cozum')]).type).toBe('problem_cozum');
  });
  it('MVP tek stil', () => {
    expect(chooseStyle(['dark-keynote'], []).style).toBe('dark-keynote');
    expect(chooseStyle(['a', 'b'], [rv('ipucu', { style: 'a' })]).style).toBe('b');
  });
});

describe('metin yardımcıları', () => {
  it('lineify uzun cümleyi ; ve virgülden böler, her satır sınır içinde', () => {
    const lines = lineify("Terk edilmiş sepet akışına 'Satın alma kontrolü' ekle; zaten alan kişiye hatırlatma gitmesin.");
    expect(lines).toEqual(["Terk edilmiş sepet akışına 'Satın alma kontrolü' ekle.", 'Zaten alan kişiye hatırlatma gitmesin.']);
    for (const l of lineify('a'.repeat(40) + ', ' + 'b'.repeat(40))) expect(l.length).toBeLessThanOrEqual(MAX_LINE_CHARS);
  });
  it('chipsOf listeyi çipe çevirir, uzun öğede vazgeçer', () => {
    expect(chipsOf('VIP, Yüksek LTV, Pasif ve İlk kez alan')).toEqual(['VIP', 'Yüksek LTV', 'Pasif', 'İlk kez alan']);
    expect(chipsOf('Email gönder, SMS gönder, Onay kontrolü adımları tek akışta')).toEqual([]);
  });
});

describe('buildScript — her içerik türü', () => {
  for (const type of CONTENT_TYPES) {
    it(`${type}: hook 0. sn, CTA sonda, 15–45 sn, kurallara uygun`, () => {
      const idea = ideas.find((i) => i.content_type === type)!;
      const script = buildScript(idea, brief);
      const caption = buildCaption(script);
      const hashtags = buildHashtags(script, brief);
      expect(script.scenes[0]).toMatchObject({ kind: 'hook', start: 0 });
      expect(script.scenes[0].duration).toBeLessThanOrEqual(3);
      expect(script.scenes.at(-1)).toMatchObject({ kind: 'cta' });
      expect(script.scenes.at(-1)!.lines).toContain('Canlı demoyu dene');
      expect(script.duration_sec).toBeGreaterThanOrEqual(15);
      expect(script.duration_sec).toBeLessThanOrEqual(45);
      expect(hashtags.length).toBeGreaterThanOrEqual(5);
      expect(hashtags.length).toBeLessThanOrEqual(10);
      expect(validatePlan(script, caption, hashtags, brief)).toEqual([]);
    });
  }

  it('CTA: ekranda ve caption\'da adres yok, "link profilde" var; hedef cal.com yalnızca kayıtta', () => {
    for (const type of CONTENT_TYPES) {
      const s = buildScript(ideas.find((i) => i.content_type === type)!, brief);
      const visible = s.scenes.flatMap((x) => x.lines).join(' ') + buildCaption(s);
      expect(visible).not.toMatch(/vercel|https?:|www\.|\.app\b|\.com\b/i);
      expect(s.scenes.at(-1)!.lines).toEqual(['Canlı demoyu dene', 'Link profilde']);
      expect(buildCaption(s)).toMatch(/link profilde/);
      expect(s.cta_url).toBe('https://cal.com/furkan-alumert');
    }
  });

  it('sahneler kare (30 fps) sınırında ve boşluksuz art arda', () => {
    const s = buildScript(ideas[0], brief);
    let t = 0;
    for (const sc of s.scenes) {
      expect(Math.abs(sc.start * 30 - t)).toBeLessThan(1e-6);
      t += sc.frames;
    }
  });

  it('örnek veri gösteren videonun caption\'ında "örnek veri" notu var', () => {
    const s = buildScript(ideas.find((i) => i.content_type === 'mini_demo')!, brief);
    expect(s.sample_data).toBe(true);
    expect(buildCaption(s)).toMatch(/örnek veridir/);
  });

  it('önce/sonra anlatımında sonuç rakamı yok', () => {
    const s = buildScript(ideas.find((i) => i.content_type === 'once_sonra')!, brief);
    const text = s.scenes.flatMap((x) => x.lines).join(' ') + buildCaption(s);
    expect(checkClaims(text)).toEqual([]);
    expect(text).not.toMatch(/\d+\s?%|%\s?\d+/);
  });

  it('brief dışı (commit) fikirde gözden geçirme notu düşer', () => {
    const changelog: Idea = { ...ideas[0], id: 'c', source: 'changelog', source_ref: 'abc', idea: 'Yeni: Add VIP export', content_type: 'mini_demo' };
    expect(buildScript(changelog, brief).review_notes[0]).toMatch(/gözden geçirip/);
  });
});

describe('validatePlan yakalar', () => {
  const base = buildScript(ideas[0], brief);
  it('yasaklı ifade, doğrulanmamış özellik, eksik örnek veri notu, hashtag sayısı', () => {
    const bad = structuredClone(base);
    bad.scenes[1].lines = ['Mağaza senkronu ile satışlar %40 artar'];
    const problems = validatePlan(bad, 'caption', ['#a'], brief).join('\n');
    expect(problems).toMatch(/Yasaklı ifade/);
    expect(problems).toMatch(/Doğrulanmamış özellik: Mağaza senkronu/);
    expect(problems).toMatch(/örnek veri/);
    expect(problems).toMatch(/Hashtag sayısı 1/);
  });
  it('CTA sonda değilse', () => {
    const bad = structuredClone(base);
    bad.scenes.pop();
    expect(validatePlan(bad, buildCaption(bad), buildHashtags(bad, brief), brief).join()).toMatch(/Son sahne CTA/);
  });
});

describe('planDay', () => {
  const now = new Date('2026-10-22T06:00:00Z');
  it('gerekçeyi kaydeder: 14 gün özeti, tür, fikir, stil', () => {
    const r = planDay({ brief, ideas, recent: [], recentExploration: [], activeStyles: ['dark-keynote'], now });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.reason).toMatch(/Son 14 günde video yok/);
    expect(r.plan.reason).toMatch(/İçerik türü:/);
    expect(r.plan.reason).toMatch(/Neden bu fikir:/);
    expect(r.plan.reason).toMatch(/Stil: dark-keynote/);
    expect(r.plan.script.content_type).toBe('problem_cozum');
  });

  it('son 3 videodaki cümleyi tekrar eden fikri atlar', () => {
    const first = planDay({ brief, ideas, recent: [], recentExploration: [], activeStyles: ['dark-keynote'], now });
    if (!first.ok) throw new Error();
    const recent = [rv('ipucu', { sentences: contentSentences(first.plan.script) })];
    const second = planDay({ brief, ideas: ideas.filter((i) => i.id !== first.plan.idea.id), recent, recentExploration: [false], activeStyles: ['dark-keynote'], now });
    if (!second.ok) throw new Error();
    const overlap = contentSentences(second.plan.script).filter((l) => contentSentences(first.plan.script).includes(l));
    expect(overlap).toEqual([]);
  });

  it('fikir yoksa plan yapmaz ve acil araştırma ister', () => {
    expect(planDay({ brief, ideas: [], recent: [], recentExploration: [], activeStyles: ['dark-keynote'], now }))
      .toMatchObject({ ok: false, needsEmergencyResearch: true });
  });
});

describe('time', () => {
  it('İstanbul ofseti +180 dk; gün başlangıcı yerel 00:00', () => {
    const at = new Date('2026-10-21T22:30:00Z'); // İstanbul'da 22 Ekim 01:30
    expect(tzOffsetMinutes(at, 'Europe/Istanbul')).toBe(180);
    expect(startOfLocalDay(at, 'Europe/Istanbul').toISOString()).toBe('2026-10-21T21:00:00.000Z');
  });
});
