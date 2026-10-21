// Render sonrası otomatik kalite kontrolü. Herhangi bir kontrol başarısızsa video "ready" olamaz.
import { execFileSync } from 'node:child_process';
import { openSync, readSync, closeSync, statSync } from 'node:fs';
import type { Script } from '../plan/script.ts';

export const MAX_BYTES = 100 * 1024 * 1024; // Meta sınırının (üçüncü taraf kaynaklara göre 300 MB) çok altında
export const MIN_BYTES = 50 * 1024;
export const DURATION_TOLERANCE = 0.15;

export interface Probe {
  width: number; height: number; fps: number; videoCodec: string; pixFmt: string;
  audioCodec: string | null; duration: number; bytes: number; moovFirst: boolean;
}

export interface TextReport { id: string; ok: boolean; problems: string[] }

export interface QcResult {
  ok: boolean;
  checks: { name: string; ok: boolean; detail: string }[];
  probe: Probe;
}

export function probe(file: string): Probe {
  const out = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file], { encoding: 'utf8' }));
  const v = out.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const a = out.streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
  const [num, den] = String(v.r_frame_rate).split('/').map(Number);
  return {
    width: v.width, height: v.height, fps: num / (den || 1), videoCodec: v.codec_name, pixFmt: v.pix_fmt,
    audioCodec: a?.codec_name ?? null, duration: Number(out.format.duration), bytes: statSync(file).size, moovFirst: moovBeforeMdat(file),
  };
}

/** MP4 kutularını sırayla okuyup moov'un mdat'tan önce gelip gelmediğine bakar ("faststart"). */
export function moovBeforeMdat(file: string): boolean {
  const fd = openSync(file, 'r');
  try {
    const size = statSync(file).size;
    const head = Buffer.alloc(16);
    let pos = 0;
    while (pos + 8 <= size) {
      readSync(fd, head, 0, 16, pos);
      let boxSize = head.readUInt32BE(0);
      const type = head.toString('latin1', 4, 8);
      if (boxSize === 1) boxSize = Number(head.readBigUInt64BE(8));
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      if (boxSize < 8) return false;
      pos += boxSize;
    }
    return false;
  } finally {
    closeSync(fd);
  }
}

/** Ekran metni (altyazı) videonun tamamını kaplıyor mu? Boş sahne veya boşluk olmamalı. */
export function subtitleCoverage(script: Script): { ok: boolean; detail: string } {
  let t = 0;
  for (const s of script.scenes) {
    if (Math.abs(s.start - t) > 1e-6) return { ok: false, detail: `${t.toFixed(2)} sn'de boşluk var` };
    if (!s.lines.some((l) => l.trim())) return { ok: false, detail: `${s.id} sahnesinde metin yok` };
    t = s.start + s.duration;
  }
  return { ok: Math.abs(t - script.duration_sec) < 0.05, detail: `0–${t.toFixed(2)} sn kapsandı` };
}

export function toSrt(script: Script): string {
  const ts = (sec: number) => {
    const ms = Math.round(sec * 1000);
    const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  return script.scenes.map((s, i) => `${i + 1}\n${ts(s.start)} --> ${ts(s.start + s.duration)}\n${s.lines.join('\n')}\n`).join('\n');
}

export function runQc(p: Probe, script: Script, textReports: TextReport[]): QcResult {
  const expectedIds = script.scenes.map((s) => s.id);
  const reported = new Set(textReports.map((r) => r.id.replace(/-title$/, '')));
  const missing = expectedIds.filter((id) => !reported.has(id));
  const bad = textReports.filter((r) => !r.ok);
  const subs = subtitleCoverage(script);
  const checks = [
    { name: 'Çözünürlük 1080×1920', ok: p.width === 1080 && p.height === 1920, detail: `${p.width}×${p.height}` },
    { name: '30 fps', ok: Math.abs(p.fps - 30) < 0.01, detail: `${p.fps}` },
    { name: 'H.264 + yuv420p', ok: p.videoCodec === 'h264' && p.pixFmt === 'yuv420p', detail: `${p.videoCodec}/${p.pixFmt}` },
    { name: 'AAC ses izi', ok: p.audioCodec === 'aac', detail: p.audioCodec ?? 'yok' },
    { name: 'Süre', ok: Math.abs(p.duration - script.duration_sec) <= DURATION_TOLERANCE && p.duration >= 15 && p.duration <= 45, detail: `${p.duration.toFixed(2)} sn (beklenen ${script.duration_sec})` },
    { name: 'Dosya boyutu', ok: p.bytes >= MIN_BYTES && p.bytes <= MAX_BYTES, detail: `${(p.bytes / 1024 / 1024).toFixed(2)} MB` },
    { name: 'moov başta (faststart)', ok: p.moovFirst, detail: p.moovFirst ? 'evet' : 'hayır' },
    { name: 'Metin taşması yok', ok: bad.length === 0 && missing.length === 0, detail: bad.length ? bad.map((b) => `${b.id}: ${b.problems.join(', ')}`).join('; ') : missing.length ? `ölçülmeyen sahne: ${missing.join(', ')}` : `${textReports.length} metin kutusu ölçüldü` },
    { name: 'Altyazı kapsaması', ok: subs.ok, detail: subs.detail },
  ];
  return { ok: checks.every((c) => c.ok), checks, probe: p };
}
