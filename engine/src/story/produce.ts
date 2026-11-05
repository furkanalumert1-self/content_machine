// Hikâye planı → seslendirme → zamanlama → render + kalite kontrolü.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RenderResult } from '../render/render.ts';
import { MAX_SEC, MIN_SEC, VOICE_SPEED } from '../topics/channel.ts';
import { stripTags, timeStory } from './build.ts';
import { renderStory } from './render.ts';
import { narration } from './timeline.ts';
import type { StoryScript } from './types.ts';
import { normalizeLoudness, synthesize, VOICE_MODEL, type Alignment } from './voice.ts';

const TAIL = 1.2;
const MAX_SPEED = 1.2;

export async function produceStory(input: StoryScript, outDir: string, name: string): Promise<RenderResult & { script?: StoryScript }> {
  mkdirSync(outDir, { recursive: true });
  let plan = input;
  const pauses = plan.segments.map((s) => Math.min(1, Math.max(0, s.pause ?? 0)));
  const notes: string[] = [];
  let speed = VOICE_SPEED;
  let { text, ranges } = narration(plan.segments);
  let raw = await synthesize(text, plan.voice.voice_id, { speed, model: plan.voice.model });
  const build = (scale: number) => {
    const sp = pauses.some(Boolean) && scale > 0 ? insertPauses(raw.audio, raw.alignment, ranges, pauses.map((x) => x * scale), outDir, name) : raw;
    const audio = normalizeLoudness(sp.audio);
    return { speech: sp, audio, dur: audioDuration(audio.audio, outDir, name) };
  };
  let { speech, audio, dur } = build(1);
  const tooLong = () => dur + TAIL > MAX_SEC - 0.3;
  // 58 sn sınırı: 1) nefes payları kısaltılır (yeni seslendirme yok), 2) eleven_v4 hızlandırılamadığı için
  // eski modelle (etiketsiz metin) biraz hızlı yeniden okutulur; eski modelde doğrudan hızlandırılır.
  if (tooLong() && pauses.some(Boolean)) {
    const total = pauses.reduce((x, y) => x + y, 0);
    const scale = Math.max(0, 1 - (dur + TAIL - (MAX_SEC - 0.5)) / total);
    ({ speech, audio, dur } = build(scale));
    notes.push(`Nefes payları %${Math.round((1 - scale) * 100)} kısaltıldı (süre sınırı).`);
  }
  if (tooLong()) {
    if (plan.voice.model === 'eleven_v4') {
      plan = { ...plan, voice: { ...plan.voice, model: VOICE_MODEL }, segments: plan.segments.map((x) => ({ ...x, say: stripTags(x.say), pause: undefined })) };
      ({ text, ranges } = narration(plan.segments));
      notes.push(`eleven_v4 sesi ${dur.toFixed(1)} sn sürdü; ${VOICE_MODEL} ile yeniden okundu.`);
    }
    speed = Math.min(MAX_SPEED, Math.round(VOICE_SPEED * ((dur + TAIL) / (MAX_SEC - 1)) * 100) / 100);
    raw = await synthesize(text, plan.voice.voice_id, { speed, model: plan.voice.model });
    ({ speech, audio, dur } = build(0));
  }
  // Ses kısa kalırsa (45 sn altı) yeniden seslendirilmez: kapanış kartı (REHBER çağrısı) sessizce biraz uzun kalır.
  const padded = Math.max(dur, MIN_SEC + 0.5 - TAIL);
  const script = timeStory(plan, {
    alignment: speech.alignment, durationSec: padded, lufs: audio.lufs,
    audioSrc: `data:audio/mp4;base64,${audio.audio.toString('base64')}`,
  });
  const r = await renderStory(script, outDir, name);
  return { ...r, script: { ...script, audio_src: undefined, review_notes: [
    ...notes,
    ...(speed !== VOICE_SPEED ? [`Ses ${speed}x hızla okundu (süre sınırı).`] : []),
    ...(padded > dur ? [`Ses ${dur.toFixed(1)} sn; kapanış kartı ${(padded - dur).toFixed(1)} sn uzatıldı (en az ${MIN_SEC} sn).`] : []),
  ] } };
}

/**
 * Bölüm sonlarına sessizlik ekler (iki bölüm arasındaki boşluğun ortasından kesilir) ve karakter zamanlarını kaydırır.
 * Animasyon Sistemi: konuşma videonun ~%60–75'i; geri kalan nefes, görüntü orada konuşur.
 */
export function insertPauses(mp3: Buffer, a: Alignment, ranges: [number, number][], pauses: number[], dir: string, name: string): { audio: Buffer; alignment: Alignment } {
  const cuts: { at: number; dur: number }[] = [];
  ranges.forEach(([, end], i) => {
    if (!pauses[i] || i + 1 >= ranges.length) return;
    const last = a.character_end_times_seconds[Math.min(end, a.characters.length) - 1];
    const next = a.character_start_times_seconds[Math.min(ranges[i + 1][0], a.characters.length - 1)];
    cuts.push({ at: (last + Math.max(last, next)) / 2, dur: pauses[i] });
  });
  if (!cuts.length) return { audio: mp3, alignment: a };
  const src = join(dir, `${name}-ham.mp3`);
  const out = join(dir, `${name}-duraklama.mp3`);
  writeFileSync(src, mp3);
  const parts: string[] = [];
  let prev = 0;
  cuts.forEach((c, i) => {
    parts.push(`[0:a]atrim=${prev}:${c.at},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono[p${i}]`, `anullsrc=r=44100:cl=mono,atrim=0:${c.dur},aformat=sample_rates=44100:channel_layouts=mono[s${i}]`);
    prev = c.at;
  });
  parts.push(`[0:a]atrim=${prev},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=mono[p${cuts.length}]`);
  const order = cuts.map((_, i) => `[p${i}][s${i}]`).join('') + `[p${cuts.length}]`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-filter_complex', `${parts.join(';')};${order}concat=n=${cuts.length * 2 + 1}:v=0:a=1[o]`, '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '192k', out]);
  const shift = (t: number) => t + cuts.filter((c) => c.at <= t).reduce((x, c) => x + c.dur, 0);
  return {
    audio: readFileSync(out),
    alignment: { characters: a.characters, character_start_times_seconds: a.character_start_times_seconds.map(shift), character_end_times_seconds: a.character_end_times_seconds.map(shift) },
  };
}

function audioDuration(audio: Buffer, dir: string, name: string): number {
  const f = join(dir, `${name}.m4a`);
  writeFileSync(f, audio);
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }));
}
