// Hikâye formatı render'ı + kalite kontrolü (görüntü, ses düzeyi, altyazı, metin taşması).
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { browserOptions, getBundle, MAX_ATTEMPTS, type RenderResult } from '../render/render.ts';
import { DURATION_TOLERANCE, MAX_BYTES, MIN_BYTES, probe, type Probe, type QcResult, type TextReport } from '../render/qc.ts';
import { MAX_SEC, MIN_SEC } from '../topics/channel.ts';
import type { StoryScript } from './types.ts';
import { renameSync } from 'node:fs';
import { measureLufs, TARGET_LUFS } from './voice.ts';

export function normalizeVideoLoudness(file: string) {
  const tmp = `${file}.ses.mp4`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-c:v', 'copy', '-af', `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11`, '-ar', '48000', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', tmp]);
  renameSync(tmp, file);
}

export function runStoryQc(p: Probe, script: StoryScript, reports: TextReport[], lufs: number | null): QcResult {
  const bad = reports.filter((r) => !r.ok);
  const measured = new Set(reports.map((r) => r.id));
  const missing = script.scenes.map((s) => s.id).filter((id) => !measured.has(id));
  const caps = script.captions;
  const gaps = caps.slice(1).map((c, i) => c.start - caps[i].end).filter((g) => g > 1.2);
  const checks = [
    { name: 'Çözünürlük 1080×1920', ok: p.width === 1080 && p.height === 1920, detail: `${p.width}×${p.height}` },
    { name: '30 fps', ok: Math.abs(p.fps - 30) < 0.01, detail: `${p.fps}` },
    { name: 'H.264 + yuv420p', ok: p.videoCodec === 'h264' && p.pixFmt === 'yuv420p', detail: `${p.videoCodec}/${p.pixFmt}` },
    { name: 'AAC ses izi', ok: p.audioCodec === 'aac', detail: p.audioCodec ?? 'yok' },
    { name: 'Süre', ok: Math.abs(p.duration - script.duration_sec) <= DURATION_TOLERANCE && p.duration >= MIN_SEC && p.duration <= MAX_SEC, detail: `${p.duration.toFixed(2)} sn (beklenen ${script.duration_sec}, ${MIN_SEC}–${MAX_SEC})` },
    { name: 'Ses düzeyi -14 LUFS (±1)', ok: lufs != null && Math.abs(lufs - TARGET_LUFS) <= 1, detail: lufs == null ? 'ölçülemedi' : `${lufs} LUFS` },
    { name: 'Dosya boyutu', ok: p.bytes >= MIN_BYTES && p.bytes <= MAX_BYTES, detail: `${(p.bytes / 1024 / 1024).toFixed(2)} MB` },
    { name: 'moov başta (faststart)', ok: p.moovFirst, detail: p.moovFirst ? 'evet' : 'hayır' },
    { name: 'Metin taşması yok', ok: !bad.length && !missing.length, detail: bad.length ? bad.map((b) => `${b.id}: ${b.problems.join(', ')}`).join('; ') : missing.length ? `ölçülmeyen sahne: ${missing.join(', ')}` : `${reports.length} metin kutusu ölçüldü` },
    { name: 'Altyazı', ok: caps.length > 0 && caps[0].start < 0.6 && !gaps.length && caps.every((c) => c.words.length <= 3), detail: `${caps.length} parça${gaps.length ? `, ${gaps.length} boşluk` : ''}` },
  ];
  return { ok: checks.every((c) => c.ok), checks, probe: p };
}

export async function renderStory(script: StoryScript, outDir: string, name: string): Promise<RenderResult & { lufs?: number | null }> {
  const errors: string[] = [];
  mkdirSync(outDir, { recursive: true });
  const serveUrl = await getBundle();
  const inputProps = { script };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const started = Date.now();
      const composition = await selectComposition({ serveUrl, id: 'Story', inputProps, ...browserOptions() });
      const file = join(outDir, `${name}.mp4`);
      const reports: TextReport[] = [];
      await renderMedia({
        serveUrl, composition, inputProps, outputLocation: file,
        codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', crf: 20, audioCodec: 'aac', audioBitrate: '160k', enforceAudioTrack: true,
        overwrite: true, logLevel: 'error', ...browserOptions(),
        onBrowserLog: (log) => { if (log.text.startsWith('QC|')) reports.push(JSON.parse(log.text.slice(3))); },
      });
      // Remotion sesi yeniden kodlar; ses düzeyi son dosyada -14 LUFS'a getirilir (görüntü kopyalanır).
      normalizeVideoLoudness(file);
      const lufs = measureLufs(file);
      const qc = runStoryQc(probe(file), script, reports, lufs);
      const output = { file, qc, textReports: reports, ms: Date.now() - started };
      if (qc.ok) return { ok: true, attempts: attempt, output, errors, lufs };
      errors.push(`Deneme ${attempt}: kalite kontrolü başarısız — ${qc.checks.filter((c) => !c.ok).map((c) => `${c.name} (${c.detail})`).join('; ')}`);
      return { ok: false, attempts: attempt, output, errors, lufs }; // içerik hataları yeniden denemeyle düzelmez
    } catch (e) {
      errors.push(`Deneme ${attempt}: ${(e as Error).message.split('\n')[0]}`);
    }
  }
  return { ok: false, attempts: MAX_ATTEMPTS, errors };
}

export async function storyContactSheet(script: StoryScript, outDir: string, name: string): Promise<string> {
  const serveUrl = await getBundle();
  const inputProps = { script };
  const composition = await selectComposition({ serveUrl, id: 'Story', inputProps, ...browserOptions() });
  const stills: string[] = [];
  for (const s of script.scenes) {
    const frame = Math.round(s.start * 30) + Math.min(s.frames - 6, Math.max(18, Math.floor(s.frames * 0.7)));
    const out = join(outDir, `${name}-${s.id}.png`);
    await renderStill({ serveUrl, composition, inputProps, frame, output: out, scale: 0.35, ...browserOptions() });
    stills.push(out);
  }
  const sheet = join(outDir, `${name}-kontak.png`);
  const perRow = 7;
  const n = stills.length;
  const pad = (perRow - (n % perRow)) % perRow;
  const inputs = [...stills, ...Array(pad).fill(stills[n - 1])];
  const layout = inputs.map((_, i) => `${(i % perRow) === 0 ? '0' : Array.from({ length: i % perRow }, () => 'w0').join('+')}_${Math.floor(i / perRow) === 0 ? '0' : Array.from({ length: Math.floor(i / perRow) }, () => 'h0').join('+')}`).join('|');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs.flatMap((f) => ['-i', f]), '-filter_complex', `xstack=inputs=${inputs.length}:layout=${layout}`, sheet]);
  return sheet;
}

export function storySrt(script: StoryScript): string {
  const ts = (sec: number) => {
    const ms = Math.round(sec * 1000);
    const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  return script.captions.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.words.map((w) => w.w).join(' ')}\n`).join('\n');
}
