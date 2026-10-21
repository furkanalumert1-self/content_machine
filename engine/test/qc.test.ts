import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseBrief } from '../src/brief/brief.ts';
import { generateIdeas } from '../src/ideas/generate.ts';
import { analyzePerformance } from '../src/ideas/performance.ts';
import { buildScript } from '../src/plan/script.ts';
import { moovBeforeMdat, runQc, subtitleCoverage, toSrt, type Probe } from '../src/render/qc.ts';

const box = (type: string, payload = 8) => {
  const b = Buffer.alloc(8 + payload);
  b.writeUInt32BE(8 + payload, 0);
  b.write(type, 4, 'latin1');
  return b;
};
const dir = mkdtempSync(join(tmpdir(), 'qc-'));
const file = (name: string, boxes: Buffer[]) => { const p = join(dir, name); writeFileSync(p, Buffer.concat(boxes)); return p; };

describe('moovBeforeMdat', () => {
  it('faststart dosyada true, değilse false', () => {
    expect(moovBeforeMdat(file('fast.mp4', [box('ftyp'), box('moov'), box('mdat', 64)]))).toBe(true);
    expect(moovBeforeMdat(file('slow.mp4', [box('ftyp'), box('mdat', 64), box('moov')]))).toBe(false);
  });
});

const brief = parseBrief(readFileSync(join(import.meta.dirname, '../../config/products/callypso-engage.md'), 'utf8'));
const idea = generateIdeas({ brief, commits: [], existing: [], performance: analyzePerformance([]) }).ideas[0];
const script = buildScript({ ...idea, id: 'x', product_id: 'p', used: false, last_used_at: null }, brief);

const good: Probe = { width: 1080, height: 1920, fps: 30, videoCodec: 'h264', pixFmt: 'yuv420p', audioCodec: 'aac', duration: script.duration_sec + 0.03, bytes: 2_000_000, moovFirst: true };
const allText = script.scenes.map((s) => ({ id: s.id, ok: true, problems: [] }));

describe('runQc', () => {
  it('her şey doğruysa geçer', () => {
    expect(runQc(good, script, allText).ok).toBe(true);
  });

  it.each([
    ['Çözünürlük 1080×1920', { width: 1920, height: 1080 }],
    ['30 fps', { fps: 25 }],
    ['H.264 + yuv420p', { pixFmt: 'yuvj420p' }],
    ['AAC ses izi', { audioCodec: null }],
    ['Süre', { duration: script.duration_sec + 1 }],
    ['Dosya boyutu', { bytes: 200 * 1024 * 1024 }],
    ['moov başta (faststart)', { moovFirst: false }],
  ] as [string, Partial<Probe>][])('%s hatasını yakalar', (name, patch) => {
    const r = runQc({ ...good, ...patch }, script, allText);
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.name === name)!.ok).toBe(false);
  });

  it('taşan veya ölçülmeyen metin kutusunu yakalar', () => {
    expect(runQc(good, script, [{ id: 's0', ok: false, problems: ['dikey taşma'] }, ...allText.slice(1)]).ok).toBe(false);
    expect(runQc(good, script, allText.slice(1)).checks.find((c) => c.name === 'Metin taşması yok')!.detail).toMatch(/ölçülmeyen sahne: s0/);
  });
});

describe('altyazı', () => {
  it('senaryo baştan sona kapsanıyor', () => {
    expect(subtitleCoverage(script).ok).toBe(true);
  });
  it('boşluk varsa yakalar', () => {
    const broken = structuredClone(script);
    broken.scenes[1].start += 0.5;
    expect(subtitleCoverage(broken).ok).toBe(false);
  });
  it('SRT biçimi', () => {
    const srt = toSrt(script);
    expect(srt.startsWith('1\n00:00:00,000 --> 00:00:0')).toBe(true);
    expect(srt).toContain('Canlı demoyu dene');
    expect(srt.split('-->').length - 1).toBe(script.scenes.length);
  });
});
