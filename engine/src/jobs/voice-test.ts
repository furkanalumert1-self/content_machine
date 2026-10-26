// ElevenLabs anahtarını dener: kısa bir cümle seslendirir, süre ve ses düzeyini yazar (anahtarı yazmaz).
import { VOICE_ID } from '../topics/channel.ts';
import { normalizeLoudness, synthesize } from '../story/voice.ts';

if (!process.env.ELEVENLABS_API_KEY) {
  console.error('ELEVENLABS_API_KEY tanımlı değil: GitHub → Settings → Secrets and variables → Actions → New repository secret.');
  process.exit(1);
}
const s = await synthesize('Sepet Röntgeni ses testi. Hadi röntgenini çekelim.', VOICE_ID);
const n = normalizeLoudness(s.audio);
const end = s.alignment.character_end_times_seconds.at(-1) ?? 0;
console.log(`Ses testi başarılı: ${end.toFixed(1)} sn, ${n.lufs} LUFS, ses ${VOICE_ID}.`);
