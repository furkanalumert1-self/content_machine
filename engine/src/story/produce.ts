// Hikâye planı → seslendirme → zamanlama → render + kalite kontrolü.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RenderResult } from '../render/render.ts';
import { MAX_SEC, VOICE_SPEED } from '../topics/channel.ts';
import { timeStory } from './build.ts';
import { renderStory } from './render.ts';
import { narration } from './timeline.ts';
import type { StoryScript } from './types.ts';
import { normalizeLoudness, synthesize } from './voice.ts';

const TAIL = 1.2;
const MAX_SPEED = 1.2;

export async function produceStory(plan: StoryScript, outDir: string, name: string): Promise<RenderResult & { script?: StoryScript }> {
  mkdirSync(outDir, { recursive: true });
  const { text } = narration(plan.segments);
  let speed = VOICE_SPEED;
  let speech = await synthesize(text, plan.voice.voice_id, { speed });
  let audio = normalizeLoudness(speech.audio);
  let dur = audioDuration(audio.audio, outDir, name);
  // Ses 58 sn sınırını aşarsa bir kez, biraz daha hızlı okutulur (ElevenLabs en fazla 1.2x).
  if (dur + TAIL > MAX_SEC - 0.3 && speed < MAX_SPEED) {
    speed = Math.min(MAX_SPEED, Math.round(speed * ((dur + TAIL) / (MAX_SEC - 1)) * 100) / 100);
    speech = await synthesize(text, plan.voice.voice_id, { speed });
    audio = normalizeLoudness(speech.audio);
    dur = audioDuration(audio.audio, outDir, name);
  }
  const script = timeStory(plan, {
    alignment: speech.alignment, durationSec: dur, lufs: audio.lufs,
    audioSrc: `data:audio/mp4;base64,${audio.audio.toString('base64')}`,
  });
  const r = await renderStory(script, outDir, name);
  return { ...r, script: { ...script, audio_src: undefined, review_notes: speed !== VOICE_SPEED ? [`Ses ${speed}x hızla okundu (süre sınırı).`] : [] } };
}

function audioDuration(audio: Buffer, dir: string, name: string): number {
  const f = join(dir, `${name}.m4a`);
  writeFileSync(f, audio);
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }));
}
