// Remotion ile 1080×1920 / 30 fps MP4 üretir, kalite kontrolünden geçirir. Başarısızsa en fazla 2 kez yeniden dener.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import type { ReelProps } from '../../remotion/Reel.tsx';
import type { Script } from '../plan/script.ts';
import { probe, runQc, type QcResult, type TextReport } from './qc.ts';

export const MAX_ATTEMPTS = 3; // ilk deneme + 2 yeniden deneme

let bundled: string | null = null;
async function getBundle() {
  bundled ??= await bundle({ entryPoint: join(import.meta.dirname, '../../remotion/Root.tsx') });
  return bundled;
}

const browserOptions = () => ({
  browserExecutable: process.env.CHROME_PATH || null,
  chromiumOptions: { gl: 'swangle' as const },
});

export interface RenderOutput { file: string; qc: QcResult; textReports: TextReport[]; ms: number }

export async function renderOnce(props: ReelProps, outDir: string, name: string): Promise<RenderOutput> {
  const started = Date.now();
  mkdirSync(outDir, { recursive: true });
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: 'Reel', inputProps: props, ...browserOptions() });
  const file = join(outDir, `${name}.mp4`);
  const reports: TextReport[] = [];
  await renderMedia({
    serveUrl, composition, inputProps: props, outputLocation: file,
    codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', crf: 20, audioCodec: 'aac', enforceAudioTrack: true,
    overwrite: true, logLevel: 'error', ...browserOptions(),
    onBrowserLog: (log) => {
      if (log.text.startsWith('QC|')) reports.push(JSON.parse(log.text.slice(3)));
    },
  });
  const qc = runQc(probe(file), props.script, reports);
  return { file, qc, textReports: reports, ms: Date.now() - started };
}

export interface RenderResult { ok: boolean; attempts: number; output?: RenderOutput; errors: string[] }

export async function renderWithRetries(
  props: ReelProps, outDir: string, name: string,
  opts: { maxAttempts?: number; onAttempt?: (n: number) => Promise<void> } = {},
): Promise<RenderResult> {
  const errors: string[] = [];
  const max = Math.min(MAX_ATTEMPTS, opts.maxAttempts ?? MAX_ATTEMPTS);
  if (max < 1) return { ok: false, attempts: 0, errors: ['Deneme hakkı kalmadı.'] };
  for (let attempt = 1; attempt <= max; attempt++) {
    await opts.onAttempt?.(attempt);
    try {
      const output = await renderOnce(props, outDir, name);
      if (output.qc.ok) return { ok: true, attempts: attempt, output, errors };
      errors.push(`Deneme ${attempt}: kalite kontrolü başarısız — ${output.qc.checks.filter((c) => !c.ok).map((c) => `${c.name} (${c.detail})`).join('; ')}`);
      // Metin taşması gibi içerik hataları yeniden denemeyle düzelmez; boşuna tekrar etme.
      if (output.qc.checks.find((c) => c.name === 'Metin taşması yok' && !c.ok)) return { ok: false, attempts: attempt, output, errors };
    } catch (e) {
      errors.push(`Deneme ${attempt}: ${(e as Error).message.split('\n')[0]}`);
    }
  }
  return { ok: false, attempts: max, errors };
}

/** Her sahnenin ortasından bir kare alıp tek bir kontak sayfasında birleştirir (görsel doğrulama için). */
export async function contactSheet(props: ReelProps, outDir: string, name: string): Promise<string> {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: 'Reel', inputProps: props, ...browserOptions() });
  const stills: string[] = [];
  let from = 0;
  for (const s of props.script.scenes) {
    const frame = from + Math.min(s.frames - 7, Math.max(20, Math.floor(s.frames / 2)));
    const out = join(outDir, `${name}-${s.id}.png`);
    await renderStill({ serveUrl, composition, inputProps: props, frame, output: out, scale: 0.4, ...browserOptions() });
    stills.push(out);
    from += s.frames;
  }
  const sheet = join(outDir, `${name}-kontak.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...stills.flatMap((f) => ['-i', f]), '-filter_complex', `hstack=inputs=${stills.length}`, sheet]);
  return sheet;
}
