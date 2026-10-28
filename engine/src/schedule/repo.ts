import type { SupabaseClient } from '@supabase/supabase-js';
import { engagementScore } from '../metrics/insights.ts';
import type { ChooseInput } from './slots.ts';

type MetricRow = { checkpoint: number | null; views: number | null; likes: number | null; saved: number | null };

/** Saat seçimi için geçmiş: yayınlanmış videolar (en geç kontrol noktasının puanı), son planlar, takipçi aktifliği. */
export async function scheduleInputs(db: SupabaseClient): Promise<Pick<ChooseInput, 'history' | 'recentPlanned' | 'onlineByHour' | 'occupied'>> {
  const { data: published } = await db.from('videos').select('published_at, metrics(checkpoint, views, likes, saved)')
    .eq('status', 'published').not('published_at', 'is', null);
  const history = (published ?? []).map((v) => {
    const m = [...((v.metrics as MetricRow[]) ?? [])].sort((a, b) => (b.checkpoint ?? 0) - (a.checkpoint ?? 0))[0];
    return { publishedAt: new Date(v.published_at), score: m ? engagementScore(m) : null };
  });

  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data: planned } = await db.from('videos').select('publish_at').neq('status', 'published')
    .not('publish_at', 'is', null).gte('created_at', since);

  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data: activity } = await db.from('audience_activity').select('hour_local, followers_online').gte('day', monthAgo);
  let onlineByHour: number[] | null = null;
  if (activity?.length) {
    const sum = Array(24).fill(0), count = Array(24).fill(0);
    for (const a of activity) { sum[a.hour_local] += Number(a.followers_online); count[a.hour_local]++; }
    onlineByHour = sum.map((s, h) => (count[h] ? s / count[h] : 0));
  }
  // Dolu aralıklar: dünden itibaren yayın saati olan, reddedilmemiş/başarısız olmamış videolar.
  const { data: taken } = await db.from('videos').select('publish_at')
    .in('status', ['planned', 'rendering', 'ready', 'approved', 'publishing', 'published'])
    .gte('publish_at', new Date(Date.now() - 86_400_000).toISOString());
  return { history, recentPlanned: (planned ?? []).map((p) => new Date(p.publish_at)), onlineByHour, occupied: (taken ?? []).map((t) => new Date(t.publish_at)) };
}
