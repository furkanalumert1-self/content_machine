// Seslendirme zamanlamasından sahne ve altyazı zaman çizelgesi kurar.
import { FPS } from '../plan/script.ts';
import { spoken, type Replacement } from './spoken.ts';
import type { Alignment } from './voice.ts';
import type { CaptionChunk, StoryScene, StorySegment, WordTiming } from './types.ts';

/**
 * Seslendirilecek birleşik metin (Türkçe okunuşa çevrilmiş), her segmentin karakter aralığı ve
 * okunuşa çevrilen parçalar (altyazıda özgün hâliyle, ör. "3,6", gösterilir).
 */
export function narration(segments: StorySegment[]): { text: string; ranges: [number, number][]; replacements: Replacement[] } {
  const ranges: [number, number][] = [];
  const replacements: Replacement[] = [];
  let text = '';
  for (const s of segments) {
    if (text) text += ' ';
    const start = text.length;
    const sp = spoken(s.say.trim());
    replacements.push(...sp.replacements.map((r) => ({ ...r, from: r.from + start, to: r.to + start })));
    text += sp.text;
    ranges.push([start, text.length]);
  }
  return { text, ranges, replacements };
}

/** Okunuşa çevrilmiş parçaların kelimelerini tek altyazı kelimesinde birleştirir ("üç virgül altı" → "3,6"). */
export function restoreOriginals<T extends WordTiming & { from: number; to: number }>(words: T[], reps: Replacement[]): T[] {
  const out: T[] = [];
  for (const w of words) {
    const r = reps.find((x) => w.from < x.to && w.to > x.from);
    const prev = out.at(-1);
    if (r && prev && prev.from < r.to && prev.to > r.from) {
      prev.end = w.end;
      prev.to = w.to;
      prev.w = r.original + w.w.slice(Math.max(0, r.to - w.from)); // sondaki noktalama korunur
      continue;
    }
    out.push(r ? { ...w, w: r.original + w.w.slice(Math.max(0, r.to - w.from)) } : w);
  }
  return out;
}

/** Karakter zamanlamasından kelime zamanlaması (noktalama kelimeye yapışık kalır). */
export function wordsFrom(a: Alignment): (WordTiming & { from: number; to: number })[] {
  const out: (WordTiming & { from: number; to: number })[] = [];
  let cur: (WordTiming & { from: number; to: number }) | null = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) out.push(cur); cur = null; return; }
    const s = a.character_start_times_seconds[i];
    const e = a.character_end_times_seconds[i];
    if (!cur) cur = { w: ch, start: s, end: e, from: i, to: i + 1 };
    else { cur.w += ch; cur.end = e; cur.to = i + 1; }
  });
  if (cur) out.push(cur);
  return out;
}

const MAX_CHUNK_WORDS = 3;
const MAX_CHUNK_CHARS = 22;

/** Altyazı: en fazla 3 kelime / 22 karakterlik parçalar; cümle sonunda parça kapanır. */
export function captionChunks(words: WordTiming[]): CaptionChunk[] {
  const chunks: CaptionChunk[] = [];
  let cur: WordTiming[] = [];
  const flush = () => { if (cur.length) chunks.push({ start: cur[0].start, end: cur.at(-1)!.end, words: cur }); cur = []; };
  for (const w of words) {
    if (cur.length && (cur.length >= MAX_CHUNK_WORDS || [...cur, w].map((x) => x.w).join(' ').length > MAX_CHUNK_CHARS)) flush();
    cur.push(w);
    if (/[.!?:…]$/.test(w.w)) flush();
  }
  flush();
  // Parçalar arasında boşluk kalmasın: her parça bir sonrakinin başına kadar ekranda kalır.
  for (let i = 0; i < chunks.length - 1; i++) chunks[i].end = Math.max(chunks[i].end, Math.min(chunks[i + 1].start, chunks[i].end + 0.6));
  return chunks;
}

/**
 * Sahneler: her segment, kendi ilk kelimesinin başladığı anda başlar ve sonrakine kadar sürer.
 * İlk sahne 0'da başlar; son sahne sesin bitişinden sonra `tail` saniye ekranda kalır.
 */
export function storyScenes(segments: StorySegment[], ranges: [number, number][], words: ReturnType<typeof wordsFrom>, audioEnd: number, tail = 1.2): StoryScene[] {
  const starts = ranges.map(([from], i) => (i === 0 ? 0 : words.find((w) => w.from >= from)?.start ?? audioEnd));
  const total = audioEnd + tail;
  let frameCursor = 0;
  let mode: StoryScene['mode'] = 'light';
  return segments.map((s, i) => {
    mode = s.mode ?? mode; // mod (açık / röntgen) değişene kadar sürer
    const endSec = i + 1 < segments.length ? starts[i + 1] : total;
    const endFrame = Math.round(endSec * FPS);
    const frames = Math.max(1, endFrame - frameCursor);
    const scene: StoryScene = { id: `s${i}`, start: frameCursor / FPS, duration: frames / FPS, frames, say: s.say, show: s.show, mode };
    frameCursor += frames;
    return scene;
  });
}
