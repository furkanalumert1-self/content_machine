import type { ContentType, VideoPerformance } from './types.ts';

export const MIN_VIDEOS_FOR_LEARNING = 10;

export interface PerformanceInsight {
  enough: boolean;
  note: string;
  /** İçerik türü başına -15..+15 puan düzeltmesi. Veri yetersizse boş. */
  typeAdjust: Partial<Record<ContentType, number>>;
}

// Etkileşim puanı: kaydetme izlenmeden daha güçlü sinyal. Eksik metrik uydurulmaz, o video hesaba katılmaz.
const engagement = (v: VideoPerformance) =>
  v.views == null ? null : v.views + 5 * (v.likes ?? 0) + 15 * (v.saved ?? 0);

export function analyzePerformance(videos: VideoPerformance[]): PerformanceInsight {
  const scored = videos.map((v) => ({ v, e: engagement(v) })).filter((x): x is { v: VideoPerformance; e: number } => x.e != null);
  if (scored.length < MIN_VIDEOS_FOR_LEARNING) {
    return {
      enough: false,
      note: `Veri yetersiz: metriği olan ${scored.length} video var, öğrenme için en az ${MIN_VIDEOS_FOR_LEARNING} gerekli.`,
      typeAdjust: {},
    };
  }
  scored.sort((a, b) => b.e - a.e);
  const top = scored.slice(0, 5).map((x) => x.v);
  const bottom = scored.slice(-5).map((x) => x.v);
  const mostCommon = (list: VideoPerformance[], key: 'content_type' | 'style' | 'publish_hour') => {
    const counts = new Map<string, number>();
    for (const v of list) counts.set(String(v[key]), (counts.get(String(v[key])) ?? 0) + 1);
    const [val, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return `${val} (${n}/5)`;
  };

  const mean = scored.reduce((s, x) => s + x.e, 0) / scored.length;
  const typeAdjust: Partial<Record<ContentType, number>> = {};
  const byType = new Map<ContentType, number[]>();
  for (const { v, e } of scored) byType.set(v.content_type, [...(byType.get(v.content_type) ?? []), e]);
  for (const [t, list] of byType) {
    if (list.length < 2) continue; // tek videodan genelleme yapma
    const avg = list.reduce((s, e) => s + e, 0) / list.length;
    typeAdjust[t] = Math.max(-15, Math.min(15, Math.round(((avg - mean) / (mean || 1)) * 30)));
  }

  return {
    enough: true,
    note:
      `En iyi 5: içerik türü ${mostCommon(top, 'content_type')}, saat ${mostCommon(top, 'publish_hour')}. ` +
      `En kötü 5: içerik türü ${mostCommon(bottom, 'content_type')}, saat ${mostCommon(bottom, 'publish_hour')}.`,
    typeAdjust,
  };
}
