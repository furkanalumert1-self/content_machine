// ElevenLabs seslendirme: metin → ses + karakter zamanlaması. Anahtar yalnızca ortam değişkeninden okunur, loglanmaz.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const VOICE_MODEL = 'eleven_multilingual_v2';
export const TARGET_LUFS = -14;

export interface Alignment { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }
export interface Speech { audio: Buffer; alignment: Alignment }

export async function synthesize(text: string, voiceId: string, opts: { speed?: number; apiKey?: string } = {}): Promise<Speech> {
  const key = opts.apiKey ?? process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY tanımlı değil.');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text, model_id: VOICE_MODEL, language_code: 'tr',
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, speed: opts.speed ?? 1.1 },
    }),
  });
  if (!res.ok) {
    // Gövde anahtar içermez; yalnızca durum ve hata kodu bildirilir.
    const body = await res.json().catch(() => ({})) as { detail?: { code?: string; status?: string } };
    throw new Error(`ElevenLabs seslendirme başarısız (HTTP ${res.status}${body.detail?.code ? `, ${body.detail.code}` : ''}).`);
  }
  const data = await res.json() as { audio_base64: string; alignment: Alignment };
  return { audio: Buffer.from(data.audio_base64, 'base64'), alignment: data.alignment };
}

/** Sesi Instagram için -14 LUFS'a getirir (AAC, 48 kHz). Süre değişmez. */
export function normalizeLoudness(mp3: Buffer): { audio: Buffer; lufs: number | null } {
  const dir = mkdtempSync(join(tmpdir(), 'ses-'));
  try {
    const src = join(dir, 'in.mp3');
    const out = join(dir, 'out.m4a');
    writeFileSync(src, mp3);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11`, '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', out]);
    return { audio: readFileSync(out), lufs: measureLufs(out) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function measured(log: string): number | null {
  const m = [...log.matchAll(/I:\s+(-?\d+(?:\.\d+)?) LUFS/g)].at(-1);
  return m ? Number(m[1]) : null;
}

/** Ölçüm: verilen ses dosyasının bütünleşik ses düzeyi (LUFS). */
export function measureLufs(file: string): number | null {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
  return measured(r.stderr ?? '');
}
