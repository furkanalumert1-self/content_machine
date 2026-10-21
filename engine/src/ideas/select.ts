import type { ContentType, Idea } from './types.ts';

export const REPEAT_BLOCK_DAYS = 60;
export const EXPLORATION_EVERY = 4;
export const LOW_STOCK = 10;

const DAY = 86_400_000;

export function isUsable(idea: Idea, now: Date): boolean {
  if (!idea.used) return true;
  if (!idea.last_used_at) return false;
  return now.getTime() - new Date(idea.last_used_at).getTime() >= REPEAT_BLOCK_DAYS * DAY;
}

export interface Selection {
  idea: Idea | null;
  reason: string;
  usableLeft: number;
  needsEmergencyResearch: boolean;
}

/**
 * @param recentPicks son seçilen fikirlerin keşif bayrakları, en yeniden eskiye.
 * Kural: dört günde bir keşif fikri → son 3 seçimde keşif yoksa bugün keşif.
 */
export function selectIdea(
  ideas: Idea[],
  recentPicks: boolean[],
  now = new Date(),
  opts: { preferredType?: ContentType } = {},
): Selection {
  const allUsable = ideas.filter((i) => isUsable(i, now)).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const ofType = opts.preferredType ? allUsable.filter((i) => i.content_type === opts.preferredType) : [];
  const usable = ofType.length ? ofType : allUsable;
  const typeNote = !opts.preferredType ? ''
    : ofType.length ? ` İçerik türü sırası: ${opts.preferredType}.`
    : ` Sıradaki tür (${opts.preferredType}) için fikir kalmadı; tüm türlerden seçildi.`;
  const wantExploration =
    recentPicks.length >= EXPLORATION_EVERY - 1 && recentPicks.slice(0, EXPLORATION_EVERY - 1).every((e) => !e);

  let idea: Idea | null = null;
  let reason: string;
  // Keşif günü türden önce gelir: sıradaki türde keşif fikri yoksa diğer türlere bakılır.
  const exploreFrom = usable.some((i) => i.is_exploration) ? usable : allUsable;
  if (wantExploration && exploreFrom.some((i) => i.is_exploration)) {
    idea = exploreFrom.find((i) => i.is_exploration)!;
    reason = `Keşif günü (son ${EXPLORATION_EVERY - 1} gün keşif yapılmadı); en yüksek puanlı keşif fikri (${idea.score}).`;
  } else {
    idea = usable.find((i) => !i.is_exploration) ?? usable[0] ?? null;
    reason = idea
      ? `Kullanılmamış en yüksek puanlı fikir (${idea.score}).${wantExploration ? ' Keşif günüydü ama keşif fikri kalmadı.' : ''}`
      : 'Kullanılabilir fikir yok.';
  }

  const usableLeft = allUsable.length - (idea ? 1 : 0);
  return { idea, reason: reason + (idea ? typeNote : ''), usableLeft, needsEmergencyResearch: usableLeft < LOW_STOCK };
}
