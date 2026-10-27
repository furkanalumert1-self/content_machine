// Reels kapağı: Cover kompozisyonundan 1080×1920 JPEG (Instagram cover_url: JPEG, ≤8 MB, 9:16).
import { statSync } from 'node:fs';
import { renderStill, selectComposition } from '@remotion/renderer';
import type { CoverProps, CoverSpec } from '../../remotion/Cover.tsx';
import { browserOptions, getBundle } from '../render/render.ts';
import type { TextReport } from '../render/qc.ts';

export const COVER_MAX_BYTES = 8 * 1024 * 1024;

export async function renderCover(cover: CoverSpec, channel: string, caseNo: number, file: string): Promise<{ ok: boolean; problems: string[] }> {
  const serveUrl = await getBundle();
  const inputProps: CoverProps = { cover, channel, caseNo };
  const composition = await selectComposition({ serveUrl, id: 'Cover', inputProps, ...browserOptions() });
  const reports: TextReport[] = [];
  await renderStill({
    serveUrl, composition, inputProps, output: file, frame: 0, imageFormat: 'jpeg', jpegQuality: 90, overwrite: true, ...browserOptions(),
    onBrowserLog: (log) => { if (log.text.startsWith('QC|')) reports.push(JSON.parse(log.text.slice(3))); },
  });
  const problems = [
    // Tek kare render'da sayfa ekran dışında konumlanır; güvenli alan sabit yerleşimle sağlanır, yalnızca taşma denetlenir.
    ...reports.flatMap((r) => r.problems.filter((p) => p.includes('taşma')).map((p) => `Kapak ${r.id}: ${p}`)),
    ...(statSync(file).size > COVER_MAX_BYTES ? ['Kapak 8 MB sınırını aşıyor.'] : []),
  ];
  return { ok: problems.length === 0, problems };
}
