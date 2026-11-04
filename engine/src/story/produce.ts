// Hikâye planı → seslendirme → zamanlama → render + kalite kontrolü.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RenderResult } from '../render/render.ts';
import { MAX_SEC, MIN_SEC, VOICE_SPEED } from '../topics/channel.ts';
import { timeStory } from './build.ts';
import { renderStory } from './render.ts';
import { narration } from './timeline.ts';
import type { StoryScript } from './types.ts';
import { normalizeLoudness, synthesize, type Alignment } from './voice.ts';

const TAIL = 1.2;
const MAX_SPEED = 1.2;

export async function produceStory(plan: StoryScript, outDir: string, name: string): Promise<RenderResult & { script?: StoryScript }> {
  mkdirSync(outDir, { recursive: true });
  const { text, ranges } = narration(plan.segments);
  const model = plan.voice.model;
  const pauses = plan.segments.map((s) => Math.min(1, Math.max(0, s.pause ?? 0)));
  const synth = async (speed: number) => {
    const raw = await synthesize(text, plan.voice.voice_id, { speed, model });
    return pauses.some(Boolean) ? insertPauses(raw.audio, raw.alignment, ranges, pauses, outDir, name) : raw;
  };
  let speed = VOICE_SPEED;
  let speech = await synth(speed);
  let audio = normalizeLoudness(speech.audio);
  let dur = audioDuration(audio.audio, outDir, name);
  // Ses 58 sn sınırını aşarsa bir kez, biraz daha hızlı okutulur (ElevenLabs en fazla 1.2x; eleven_v4 hızlandırılmaz).
  if (dur + TAIL > MAX_SEC - 0.3 && speed < MAX_SPEED && model !== 'eleven_v4') {
    speed = Math.min(MAX_SPEED, Math.round(speed * ((dur + TAIL) / (MAX_SEC - 1)) * 100) / 100);
    speech = await synth(speed);
    audio = normalizeLoudness(speech.audio);
    dur = audioDuration(audio.audio, outDir, name);
  }
  // Ses kısa kalırsa (45 sn altı) yeniden seslendirilmez: kapanış kartı (REHBER çağrısı) sessizce biraz uzun kalır.
  const padded = Math.max(dur, MIN_SEC + 0.5 - TAIL);
  const script = timeStory(plan, {
    alignment: speech.alignment, durationSec: padded, lufs: audio.lufs,
    audioSrc: `data:audio/mp4;base64,${audio.audio.toString('base64')}`,
  });
  const r = await renderStory(script, outDir, name);
  return { ...r, script: { ...script, audio_src: undefined, review_notes: [
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
