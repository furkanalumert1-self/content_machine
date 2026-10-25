import type { SupabaseClient } from '@supabase/supabase-js';
import { topicToIdea, validateTopic } from './bank.ts';
import type { TopicBank } from './types.ts';

export interface SyncResult { added: number; updated: number; removed: number; rejected: { key: string; problems: string[] }[] }

/**
 * Konu bankasını fikir tablosuna yansıtır. Yalnızca "dogrulandi" durumundaki ve kurallardan geçen konular girer.
 * Kullanılmış fikirlerin kullanım bilgisi korunur; bankadan çıkan kullanılmamış konu silinir.
 */
export async function syncTopics(db: SupabaseClient, productId: string, bank: TopicBank): Promise<SyncResult> {
  const rejected: SyncResult['rejected'] = [];
  const valid = bank.topics.filter((t) => {
    if (t.status !== 'dogrulandi') return false;
    const problems = validateTopic(t);
    if (problems.length) rejected.push({ key: t.key, problems });
    return !problems.length;
  });

  const { data: existing, error } = await db.from('ideas').select('id, source_ref, used').eq('product_id', productId).eq('source', 'topic_bank');
  if (error) throw error;
  const byKey = new Map((existing ?? []).map((e) => [e.source_ref as string, e]));

  let added = 0, updated = 0, removed = 0;
  for (const t of valid) {
    const row = { ...topicToIdea(t), product_id: productId };
    const old = byKey.get(t.key);
    if (old) {
      const { error: e } = await db.from('ideas').update(row).eq('id', old.id);
      if (e) throw e;
      updated++;
    } else {
      const { error: e } = await db.from('ideas').insert(row);
      if (e) throw e;
      added++;
    }
  }
  const keep = new Set(valid.map((t) => t.key));
  for (const e of existing ?? []) {
    if (!keep.has(e.source_ref) && !e.used) {
      const { error: d } = await db.from('ideas').delete().eq('id', e.id);
      if (d) throw d;
      removed++;
    }
  }
  return { added, updated, removed, rejected };
}
