import type { Brief } from '../brief/brief.ts';
import { selectIdea } from '../ideas/select.ts';
import type { Idea } from '../ideas/types.ts';
import { chooseContentType, chooseStyle, summarizeRecent, type RecentVideo } from './rotation.ts';
import { buildCaption, buildHashtags, buildScript, contentSentences, validatePlan, type Script } from './script.ts';

export const NO_REPEAT_LAST_VIDEOS = 3;
export const MAX_ATTEMPTS = 15;

export interface PlanInput {
  brief: Brief;
  siteUrl: string;
  ideas: Idea[];
  recent: RecentVideo[];          // son 14 gün, en yeniden eskiye
  recentExploration: boolean[];   // son seçimlerin keşif bayrakları
  activeStyles: string[];
  now?: Date;
}

export interface Plan {
  idea: Idea;
  style: string;
  script: Script;
  caption: string;
  hashtags: string[];
  reason: string;
  needsEmergencyResearch: boolean;
}

export type PlanResult = { ok: true; plan: Plan } | { ok: false; reason: string; needsEmergencyResearch: boolean; problems?: string[] };

/**
 * Fikirleri sırayla dener: seçilen fikrin senaryosu kurallara uymazsa o fikir atlanır ve sıradakine geçilir
 * (en fazla MAX_ATTEMPTS deneme). Son 3 videodaki bir cümleyi tekrar eden fikir de o gün atlanır (fikir havuzda kalır).
 * Hiçbiri uymazsa plan yapılmaz; hatalı video üretilmez.
 */
export function planDay(input: PlanInput): PlanResult {
  const now = input.now ?? new Date();
  const type = chooseContentType(input.recent);
  const style = chooseStyle(input.activeStyles, input.recent);
  let pool = input.ideas;
  const rejected: string[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sel = selectIdea(pool, input.recentExploration, now, { preferredType: type.type });
    if (!sel.idea) {
      return { ok: false, reason: 'Kullanılabilir fikir yok; acil fikir araştırması gerekli.', needsEmergencyResearch: true, problems: rejected };
    }
    const script = buildScript(sel.idea, input.brief, input.siteUrl);
    const caption = buildCaption(script);
    const hashtags = buildHashtags(script, input.brief);
    const problems = validatePlan(script, caption, hashtags, input.brief);
    const recentSentences = new Set(input.recent.slice(0, NO_REPEAT_LAST_VIDEOS).flatMap((r) => r.sentences ?? []));
    const repeated = contentSentences(script).filter((l) => recentSentences.has(l));
    if (repeated.length) problems.push(`Son ${NO_REPEAT_LAST_VIDEOS} videoda geçen cümle tekrar ediyor: "${repeated[0]}"`);
    if (!problems.length) {
      return {
        ok: true,
        plan: {
          idea: sel.idea, style: style.style, script, caption, hashtags,
          needsEmergencyResearch: sel.needsEmergencyResearch,
          reason: [
            summarizeRecent(input.recent),
            `İçerik türü: ${type.reason}`,
            `Fikir: ${sel.reason} Neden bu fikir: ${sel.idea.why}`,
            `Stil: ${style.style} — ${style.reason}`,
            ...(rejected.length ? [`Atlanan fikirler: ${rejected.join(' | ')}`] : []),
            ...(sel.needsEmergencyResearch ? [`Kullanılabilir fikir ${sel.usableLeft}; acil araştırma istendi.`] : []),
          ].join('\n'),
        },
      };
    }
    rejected.push(`"${sel.idea.idea}": ${problems.join('; ')}`);
    pool = pool.filter((i) => i.id !== sel.idea!.id);
  }
  return { ok: false, reason: `${MAX_ATTEMPTS} fikir denendi, hiçbirinin senaryosu kurallara uymadı.`, needsEmergencyResearch: true, problems: rejected };
}
