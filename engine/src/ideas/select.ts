import type { Idea } from './types.ts';

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
export function selectIdea(ideas: Idea[], recentPicks: boolean[], now = new Date()): Selection {
  const usable = ideas.filter((i) => isUsable(i, now)).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const wantExploration =
    recentPicks.length >= EXPLORATION_EVERY - 1 && recentPicks.slice(0, EXPLORATION_EVERY - 1).every((e) => !e);

  let idea: Idea | null = null;
  let reason: string;
  if (wantExploration && usable.some((i) => i.is_exploration)) {
    idea = usable.find((i) => i.is_exploration)!;
    reason = `Keşif günü (son ${EXPLORATION_EVERY - 1} gün keşif yapılmadı); en yüksek puanlı keşif fikri (${idea.score}).`;
  } else {
    idea = usable.find((i) => !i.is_exploration) ?? usable[0] ?? null;
    reason = idea
      ? `Kullanılmamış en yüksek puanlı fikir (${idea.score}).${wantExploration ? ' Keşif günüydü ama keşif fikri kalmadı.' : ''}`
      : 'Kullanılabilir fikir yok.';
  }

  const usableLeft = usable.length - (idea ? 1 : 0);
  return { idea, reason, usableLeft, needsEmergencyResearch: usableLeft < LOW_STOCK };
}
