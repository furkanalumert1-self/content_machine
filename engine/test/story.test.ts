import { describe, expect, it } from 'vitest';
import { validateStory } from '../src/story/build.ts';
import { intToTr, spoken } from '../src/story/spoken.ts';
import { captionChunks, narration, restoreOriginals, storyScenes, wordsFrom } from '../src/story/timeline.ts';
import type { Alignment } from '../src/story/voice.ts';
import { loadBank } from '../src/topics/bank.ts';

/** Her karaktere 0,05 sn veren sahte hizalama. */
const fakeAlign = (text: string): Alignment => ({
  characters: [...text],
  character_start_times_seconds: [...text].map((_, i) => i * 0.05),
  character_end_times_seconds: [...text].map((_, i) => i * 0.05 + 0.05),
});

describe('Türkçe okunuş', () => {
  it('sayıları Türkçe okur, ondalıkta "virgül" der, binlik ayraca dokunmaz', () => {
    expect(intToTr(47)).toBe('kırk yedi');
    expect(intToTr(105)).toBe('yüz beş');
    expect(spoken('3,6 kat').text).toBe('üç virgül altı kat');
    expect(spoken('%0,5').text).toBe('yüzde sıfır virgül beş');
    expect(spoken('1.170 dolar').text).toBe('1.170 dolar');
  });
});

describe('hikâye zaman çizelgesi', () => {
  const segs = [
    { say: 'Kısa kanca burada.', show: { type: 'title' as const, text: 'Kanca' } },
    { say: 'Oran 3,6 kat daha yüksek.', show: { type: 'stat' as const, value: '3,6 kat', label: 'x' } },
    { say: 'Hadi röntgenini çekelim.', show: { type: 'xray' as const, text: 'Röntgen' }, mode: 'xray' as const },
    { say: 'Son söz.', show: { type: 'rule' as const, text: 'Son' } },
  ];
  const n = narration(segs);
  const words = restoreOriginals(wordsFrom(fakeAlign(n.text)), n.replacements);

  it('altyazıda özgün rakam görünür, parçalar en fazla 3 kelime', () => {
    const caps = captionChunks(words);
    expect(caps.flatMap((c) => c.words.map((w) => w.w))).toContain('3,6');
    expect(caps.every((c) => c.words.length <= 3)).toBe(true);
  });

  it('sahneler boşluksuz ardışık, mod değişene kadar sürer, ilk sahne 0\'da başlar', () => {
    const end = n.text.length * 0.05;
    const scenes = storyScenes(segs, n.ranges, words, end);
    expect(scenes[0].start).toBe(0);
    for (let i = 1; i < scenes.length; i++) expect(scenes[i].start).toBeCloseTo(scenes[i - 1].start + scenes[i - 1].duration, 5);
    expect(scenes.map((s) => s.mode)).toEqual(['light', 'light', 'xray', 'xray']);
    expect(scenes.at(-1)!.start + scenes.at(-1)!.duration).toBeCloseTo(end + 1.2, 1);
  });
});

describe('hikâye kuralları', () => {
  it('depodaki hikâyeler kurallardan geçer', () => {
    for (const t of loadBank().topics.filter((x) => x.story)) expect([t.key, validateStory(t)]).toEqual([t.key, []]);
  });
  it('kaynaksız rakam, eksik röntgen bölümü ve ürün adı yakalanır', () => {
    const t = structuredClone(loadBank().topics.find((x) => x.story)!);
    t.story!.segments[1].say += ' Satışlar %80 arttı. Callypso ile.';
    t.story!.segments = t.story!.segments.filter((s) => s.show.type !== 'xray');
    const p = validateStory(t).join('\n');
    expect(p).toMatch(/Kaynaksız rakam: 80/);
    expect(p).toMatch(/röntgenini çekelim/);
    expect(p).toMatch(/ürün adı/);
  });
});
