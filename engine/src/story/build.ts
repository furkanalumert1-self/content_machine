// Konu (kaynaklı) → hikâye senaryosu. Seslendirme zamanlaması gelince sahne/altyazı çizelgesi kurulur.
import { checkClaims } from '../content/claims.ts';
import { numbersIn } from '../topics/bank.ts';
import { CHANNEL_NAME, CTA_KEYWORD, MAX_HOOK_WORDS, productNameAllowed, type Phase } from '../topics/channel.ts';
import type { ContentType } from '../ideas/types.ts';
import type { Topic } from '../topics/types.ts';
import { captionChunks, narration, restoreOriginals, storyScenes, wordsFrom } from './timeline.ts';
import type { Beat, StoryScript } from './types.ts';
import { VOICE_MODEL, type Alignment } from './voice.ts';

export const XRAY_LINE = 'Hadi röntgenini çekelim.';
/** Ölçülen hız (1.1x): ~2,27 kelime/sn + 1,2 sn kapanış → 45–58 sn için 103–128 kelime. */
export const MIN_WORDS = 103;
export const MAX_WORDS = 128;
export const WORDS_PER_SEC = 2.27;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
// Saat ve kaynak notu süs/künyedir, iddia değil; rakam denetimine girmez.
const DECOR = new Set(['type', 'time', 'note', 'icon']);
const beatText = (b: Beat): string => Object.entries(b).filter(([k]) => !DECOR.has(k))
  .flatMap(([, v]) => (typeof v === 'string' ? [v] : typeof v === 'object' && v ? [beatText(v as Beat)] : [])).join(' ');

/** Hikâye kuralları: kanca ≤8 kelime, röntgen cümlesi, kapanışta REHBER, uzunluk, kaynak kapısı, ürün adı yok. */
export function validateStory(topic: Topic, phase: Phase = 1): string[] {
  const p: string[] = [];
  const segs = topic.story?.segments ?? [];
  if (!segs.length) return ['Konunun hikâye metni yok.'];
  const firstSentence = segs[0].say.split(/(?<=[.!?])\s+/)[0];
  if (words(firstSentence) > MAX_HOOK_WORDS) p.push(`Kanca ${MAX_HOOK_WORDS} kelimeyi aşıyor: "${firstSentence}"`);
  if (!segs.some((s) => s.say.includes(XRAY_LINE) && s.show.type === 'xray')) p.push(`"${XRAY_LINE}" bölümü yok.`);
  const last = segs.at(-1)!;
  if (last.show.type !== 'outro' || !last.say.includes(CTA_KEYWORD)) p.push(`Son bölüm kapanış olmalı ve ${CTA_KEYWORD} demeli.`);
  const total = words(narration(segs).text);
  if (total < MIN_WORDS || total > MAX_WORDS) p.push(`Anlatı ${total} kelime; ${MIN_WORDS}–${MAX_WORDS} olmalı.`);

  const all = segs.map((s) => `${s.say} ${beatText(s.show)}`).join('\n');
  if (!productNameAllowed(phase) && /callypso/i.test(all)) p.push('Faz 1: ürün adı geçmemeli.');
  const sourced = new Set([...topic.facts.flatMap((f) => numbersIn(f.text)), ...topic.action.flatMap(numbersIn), '25']);
  const outro = last.show.type === 'outro' ? String(last.show.caseNo) : '';
  for (const n of new Set(numbersIn(all))) if (!sourced.has(n) && n !== outro) p.push(`Kaynaksız rakam: ${n}`);
  for (const i of checkClaims(all, { sourcedNumbers: sourced })) p.push(`Yasaklı ifade (${i.rule}): "${i.match}"`);
  return p;
}

/** Planlama: seslendirmesiz hikâye planı (süre tahmini). Seslendirme ve sahne zamanlaması render işinde yapılır. */
export function planStory(topic: Topic, caseNo: number, contentType: ContentType, voiceId: string): StoryScript {
  const segments = topic.story!.segments.map((s) => (s.show.type === 'outro' ? { ...s, show: { ...s.show, caseNo } } : s));
  const est = Math.min(58, Math.max(45, Math.round((words(narration(segments).text) / WORDS_PER_SEC + 1.2) * 100) / 100));
  return {
    version: 2, format: 'story', product: CHANNEL_NAME, channel: CHANNEL_NAME, content_type: contentType,
    case_no: caseNo, case_label: topic.story!.label, hook: segments[0].say.split(/(?<=[.!?])\s+/)[0],
    segments, scenes: [], captions: [], duration_sec: est,
    voice: { provider: 'elevenlabs', voice_id: voiceId, model: VOICE_MODEL, lufs: null },
    cta: segments.at(-1)!.say, cta_url: '', sample_data: false, review_notes: [],
    sources: [...new Map(topic.facts.map((f) => [f.source_url, { label: f.source_label, url: f.source_url }])).values()],
    funnel: topic.funnel,
    cover: { line1: topic.cover.line1, line2: topic.cover.line2, icon: topic.cover.icon, theme: topic.cover.theme, ...(topic.cover.number ? { number: topic.cover.number } : {}) },
  };
}

/** Render: seslendirme zamanlamasıyla sahne ve altyazı çizelgesini doldurur. */
export function timeStory(plan: StoryScript, speech: { alignment: Alignment; audioSrc?: string; durationSec: number; lufs: number | null }): StoryScript {
  const { ranges, replacements } = narration(plan.segments);
  const w = restoreOriginals(wordsFrom(speech.alignment), replacements);
  const scenes = storyScenes(plan.segments, ranges, w, speech.durationSec);
  const last = scenes.at(-1)!;
  return {
    ...plan, scenes, captions: captionChunks(w.map(({ w: t, start, end }) => ({ w: t, start, end }))),
    duration_sec: Math.round((last.start + last.duration) * 100) / 100,
    audio_src: speech.audioSrc,
    voice: { ...plan.voice, lufs: speech.lufs },
  };
}
