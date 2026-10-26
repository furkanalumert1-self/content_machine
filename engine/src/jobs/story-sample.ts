// Hikâye formatı örneği (veritabanı olmadan): konu → ElevenLabs seslendirme → render → kalite kontrolü → kontak sayfası.
// Çalıştırma: ELEVENLABS_API_KEY=… npx tsx src/jobs/story-sample.ts <konu-anahtarı> [ses-id]   (çıktı: out/hikaye/)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { planStory, validateStory } from '../story/build.ts';
import { produceStory } from '../story/produce.ts';
import { storyContactSheet, storySrt } from '../story/render.ts';
import { loadBank } from '../topics/bank.ts';
import { VOICE_ID } from '../topics/channel.ts';
import { PILLAR_TYPE } from '../topics/types.ts';

const [key, voiceId = VOICE_ID] = process.argv.slice(2);
const topic = loadBank().topics.find((t) => t.key === key);
if (!topic?.story) throw new Error(`Hikâyesi olan konu bulunamadı: ${key}`);
const problems = validateStory(topic);
if (problems.length) throw new Error(`Hikâye kurallara uymuyor:\n- ${problems.join('\n- ')}`);

const outDir = join(import.meta.dirname, '../../../out/hikaye');
const name = key;
const r = await produceStory(planStory(topic, 1, PILLAR_TYPE[topic.pillar], voiceId), outDir, name);
console.log(`\n## ${name} — ${r.ok ? 'GEÇTİ' : 'BAŞARISIZ'} (${r.script?.duration_sec} sn)`);
for (const c of r.output?.qc.checks ?? []) console.log(`${c.ok ? '✓' : '✗'} ${c.name}: ${c.detail}`);
for (const e of r.errors) console.log(`! ${e}`);
for (const n of r.script?.review_notes ?? []) console.log(`not: ${n}`);
if (r.script) {
  writeFileSync(join(outDir, `${name}.srt`), storySrt(r.script));
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(r.script, null, 2));
  if (r.output) console.log(`kontak: ${await storyContactSheet({ ...r.script }, outDir, name)}`);
}
