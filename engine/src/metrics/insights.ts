// Reels metrikleri: yayından 24 ve 72 saat sonra (Meta verisi 48 saate kadar gecikebilir).
// Eksik metrik NULL kalır; asla tahmin edilmez veya 0 yazılmaz.

export const CHECKPOINTS = [24, 72] as const;
export type Checkpoint = (typeof CHECKPOINTS)[number];
export const CHECKPOINT_GIVE_UP_HOURS = 14 * 24; // bu süreden sonra kaçırılan kontrol noktası alınmaz

export const REEL_METRICS = ['views', 'reach', 'likes', 'comments', 'saved', 'shares', 'total_interactions', 'ig_reels_avg_watch_time'] as const;
export type ReelMetric = (typeof REEL_METRICS)[number];

export interface MetricRow {
  views: number | null; reach: number | null; likes: number | null; comments: number | null;
  saved: number | null; shares: number | null; total_interactions: number | null; avg_watch_time_raw: number | null;
}

/** Etkileşim puanı: kaydetme en güçlü sinyal. İzlenme yoksa puan yok. */
export function engagementScore(m: { views: number | null; likes: number | null; saved: number | null }): number | null {
  return m.views == null ? null : m.views + 5 * (m.likes ?? 0) + 15 * (m.saved ?? 0);
}

type InsightsJson = { data?: { name: string; values?: { value: unknown }[]; total_value?: { value: unknown } }[] };

export function parseInsights(json: InsightsJson): Partial<Record<ReelMetric, number>> {
  const out: Partial<Record<ReelMetric, number>> = {};
  for (const d of json.data ?? []) {
    const raw = d.total_value?.value ?? d.values?.[0]?.value;
    if (typeof raw === 'number' && Number.isFinite(raw) && (REEL_METRICS as readonly string[]).includes(d.name)) out[d.name as ReelMetric] = raw;
  }
  return out;
}

export function toRow(p: Partial<Record<ReelMetric, number>>): MetricRow {
  return {
    views: p.views ?? null, reach: p.reach ?? null, likes: p.likes ?? null, comments: p.comments ?? null,
    saved: p.saved ?? null, shares: p.shares ?? null, total_interactions: p.total_interactions ?? null,
    avg_watch_time_raw: p.ig_reels_avg_watch_time ?? null,
  };
}

/** Zamanı gelmiş ve henüz alınmamış kontrol noktaları. */
export function dueCheckpoints(publishedAt: Date, done: number[], now: Date): Checkpoint[] {
  const hours = (now.getTime() - publishedAt.getTime()) / 3_600_000;
  if (hours > CHECKPOINT_GIVE_UP_HOURS) return [];
  // 72. saat geçmişse ve 24 alınmadıysa yalnızca 72 alınır (24'lük veri artık o anı temsil etmez).
  const due = CHECKPOINTS.filter((c) => hours >= c && !done.includes(c));
  return due.includes(72) ? [72] : due;
}

/** online_followers yanıtı: { value: { "0": n, ..., "23": n } } saatleri Meta'ya göre UTC−7. İstanbul saatine çevrilir. */
export function onlineFollowersByLocalHour(json: { data?: { values?: { value?: Record<string, number>; end_time?: string }[] }[] }, sourceUtcOffsetHours: number, localUtcOffsetHours: number) {
  const days: { day: string; hours: number[] }[] = [];
  for (const v of json.data?.[0]?.values ?? []) {
    if (!v.value || !Object.keys(v.value).length) continue;
    const hours = Array(24).fill(0);
    for (const [h, n] of Object.entries(v.value)) {
      const local = (((Number(h) - sourceUtcOffsetHours + localUtcOffsetHours) % 24) + 24) % 24;
      hours[local] = n;
    }
    days.push({ day: (v.end_time ?? '').slice(0, 10), hours });
  }
  return days;
}

export function averageByHour(days: { hours: number[] }[]): number[] | null {
  if (!days.length) return null;
  return Array.from({ length: 24 }, (_, h) => days.reduce((s, d) => s + d.hours[h], 0) / days.length);
}
