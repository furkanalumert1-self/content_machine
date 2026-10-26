// Hikâye formatı örneği: konu → ElevenLabs seslendirme → render → kalite kontrolü → kontak sayfası.
// Çalıştırma: ELEVENLABS_API_KEY=… npx tsx src/jobs/story-sample.ts <konu-anahtarı> [ses-id] [hız]   (çıktı: out/hikaye/)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildStoryScript, validateStory } from '../story/build.ts';
import { renderStory, storyContactSheet, storySrt } from '../story/render.ts';
import { narration } from '../story/timeline.ts';
import { normalizeLoudness, synthesize } from '../story/voice.ts';
import { loadBank } from '../topics/bank.ts';
import { PILLAR_TYPE } from '../topics/types.ts';
import { execFileSync } from 'node:child_process';

const [key, voiceId = 'JBFqnCBsd6RMkjVDRZzb', speedArg = '1.1'] = process.argv.slice(2);
const topic = loadBank().topics.find((t) => t.key === key);
if (!topic?.story) throw new Error(`Hikâyesi olan konu bulunamadı: ${key}`);
const problems = validateStory(topic);
if (problems.length) throw new Error(`Hikâye kurallara uymuyor:\n- ${problems.join('\n- ')}`);

const outDir = join(import.meta.dirname, '../../../out/hikaye');
const { text } = narration(topic.story.segments);
const speech = await synthesize(text, voiceId, { speed: Number(speedArg) });
const norm = normalizeLoudness(speech.audio);
const name = `${key}-${voiceId.slice(0, 6)}`;
const audioFile = join(outDir, `${name}.m4a`);
execFileSync('mkdir', ['-p', outDir]);
writeFileSync(audioFile, norm.audio);
const durationSec = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioFile], { encoding: 'utf8' }));
const script = buildStoryScript(topic, 1, {
  alignment: speech.alignment, durationSec, voiceId, lufs: norm.lufs,
  audioSrc: `data:audio/mp4;base64,${norm.audio.toString('base64')}`,
}, PILLAR_TYPE[topic.pillar]);

console.log(`Anlatı: ${text.split(/\s+/).length} kelime, ses ${durationSec.toFixed(1)} sn, video ${script.duration_sec} sn, ${norm.lufs} LUFS`);
const r = await renderStory(script, outDir, name);
console.log(`\n## ${name} — ${r.ok ? 'GEÇTİ' : 'BAŞARISIZ'}`);
for (const c of r.output?.qc.checks ?? []) console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`);
for (const e of r.errors) console.log(`! ${e}`);
writeFileSync(join(outDir, `${name}.srt`), storySrt(script));
writeFileSync(join(outDir, `${name}.json`), JSON.stringify({ ...script, audio_src: undefined }, null, 2));
console.log(`kontak: ${await storyContactSheet(script, outDir, name)}`);
