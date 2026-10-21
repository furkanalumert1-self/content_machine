import type { SupabaseClient } from '@supabase/supabase-js';
import { parseBrief, type Brief } from '../brief/brief.ts';
import type { Idea, IdeaDraft, VideoPerformance } from './types.ts';

export async function approvedBrief(db: SupabaseClient, productId: string): Promise<{ id: string; brief: Brief } | null> {
  const { data, error } = await db
    .from('product_briefs').select('id, content_md').eq('product_id', productId).eq('status', 'approved').maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, brief: parseBrief(data.content_md) } : null;
}

export async function listIdeas(db: SupabaseClient, productId: string): Promise<Idea[]> {
  const { data, error } = await db.from('ideas').select('*').eq('product_id', productId);
  if (error) throw error;
  return data as Idea[];
}

export async function insertIdeas(db: SupabaseClient, productId: string, ideas: IdeaDraft[]): Promise<number> {
  if (!ideas.length) return 0;
  const { data, error } = await db
    .from('ideas')
    .upsert(ideas.map((i) => ({ ...i, product_id: productId })), { onConflict: 'product_id,idea_key', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/** Son N seçilen fikrin keşif bayrakları, en yeniden eskiye. */
export async function recentExplorationFlags(db: SupabaseClient, productId: string, n = 3): Promise<boolean[]> {
  const { data, error } = await db
    .from('videos').select('created_at, ideas(is_exploration)').eq('product_id', productId)
    .not('idea_id', 'is', null).order('created_at', { ascending: false }).limit(n);
  if (error) throw error;
  // İlişkili kayıt sürüme göre nesne veya tek elemanlı dizi gelebilir.
  return (data ?? []).map((v) => {
    const rel = v.ideas as unknown as { is_exploration: boolean } | { is_exploration: boolean }[] | null;
    return Boolean((Array.isArray(rel) ? rel[0] : rel)?.is_exploration);
  });
}

export async function performanceRows(db: SupabaseClient, productId: string, timezone: string): Promise<VideoPerformance[]> {
  const { data, error } = await db
    .from('videos')
    .select('id, idea_id, content_type, style, published_at, metrics(views, likes, saved, collected_at)')
    .eq('product_id', productId).eq('status', 'published');
  if (error) throw error;
  return (data ?? []).map((v) => {
    const latest = [...((v.metrics as { views: number | null; likes: number | null; saved: number | null; collected_at: string }[]) ?? [])]
      .sort((a, b) => b.collected_at.localeCompare(a.collected_at))[0];
    const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: timezone }).format(new Date(v.published_at)));
    return {
      video_id: v.id, idea_id: v.idea_id, content_type: v.content_type, style: v.style, publish_hour: hour,
      views: latest?.views ?? null, likes: latest?.likes ?? null, saved: latest?.saved ?? null,
    };
  });
}

export async function markIdeaUsed(db: SupabaseClient, ideaId: string, now = new Date()) {
  const { error } = await db.from('ideas').update({ used: true, last_used_at: now.toISOString() }).eq('id', ideaId);
  if (error) throw error;
}
