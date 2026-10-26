import type { Brief } from '../brief/brief.ts';
import { selectIdea } from '../ideas/select.ts';
import type { Idea } from '../ideas/types.ts';
import { allowedFunnels, pillarTargets, type Phase } from '../topics/channel.ts';
import { buildManualChannelScript, buildTopicCaption, buildTopicHashtags, buildTopicScript, captionProblems, validateTopicPlan } from '../topics/script.ts';
import { planStory, validateStory } from '../story/build.ts';
import type { StoryScript } from '../story/types.ts';
import { VOICE_ID } from '../topics/channel.ts';
import { chooseContentType, choosePillar, chooseStyle, summarizeRecent, type RecentVideo } from './rotation.ts';
import { buildCaption, buildHashtags, buildScript, contentSentences, validatePlan, type Script } from './script.ts';

export const NO_REPEAT_LAST_VIDEOS = 3;
export const MAX_ATTEMPTS = 15;

export interface PlanInput {
  brief: Brief;
  ideas: Idea[];
  recent: RecentVideo[];          // son 14 gün, en yeniden eskiye
  recentExploration: boolean[];   // son seçimlerin keşif bayrakları
  activeStyles: string[];
  /** İçerik fazı (app_settings.content_phase): 1 trafik, 2 lead, 3 dönüşüm. */
  phase: Phase;
  /** Sıradaki hikâye videosunun vaka numarası. */
  caseNo?: number;
  now?: Date;
}

export interface Built { script: Script | StoryScript; caption: string; hashtags: string[]; problems: string[] }

/**
 * Fikirden senaryo + açıklama + hashtag kurar ve kurallara göre denetler.
 * Konu bankası fikri → Sepet Röntgeni formatı; Faz 1–2'de diğer fikirler (elle) → kanal formatı;
 * ürün tanıtımı (BOF) → brief formatı.
 */
export function buildForIdea(idea: Idea, ctx: { brief: Brief; phase: Phase; targetSec?: number; caseNo?: number }): Built {
  const topic = idea.topic ?? null;
  if (topic?.story) {
    // Hikâye formatı (seslendirmeli): seslendirme ve zamanlama render işinde yapılır.
    const script = planStory(topic, ctx.caseNo ?? 1, idea.content_type, VOICE_ID);
    const caption = buildTopicCaption({ hook: script.hook, sources: script.sources } as Script, topic);
    const hashtags = buildTopicHashtags(topic);
    const problems = [...validateStory(topic, ctx.phase), ...captionProblems(caption, hashtags, topic, ctx.phase)];
    return { script, caption, hashtags, problems };
  }
  if (topic || (ctx.phase < 3 && (idea.funnel ?? 'BOF') !== 'BOF')) {
    const script = topic ? buildTopicScript(idea, topic, ctx) : buildManualChannelScript(idea, ctx);
    const caption = buildTopicCaption(script, topic);
    const hashtags = buildTopicHashtags(topic);
    return { script, caption, hashtags, problems: validateTopicPlan(script, caption, hashtags, topic, ctx.phase) };
  }
  const script = buildScript(idea, ctx.brief, ctx);
  const caption = buildCaption(script);
  const hashtags = buildHashtags(script, ctx.brief);
  return { script, caption, hashtags, problems: validatePlan(script, caption, hashtags, ctx.brief) };
}

export interface Plan {
  idea: Idea;
  style: string;
  script: Script | StoryScript;
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
  const type = input.phase < 3 ? choosePillar(input.recent, pillarTargets(input.phase)) : chooseContentType(input.recent);
  const style = chooseStyle(input.activeStyles, input.recent);
  const funnels = allowedFunnels(input.phase);
  let pool = input.ideas.filter((i) => funnels.includes(i.funnel ?? 'BOF'));
  const rejected: string[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sel = selectIdea(pool, input.recentExploration, now, { preferredType: type.type });
    if (!sel.idea) {
      return { ok: false, reason: 'Kullanılabilir fikir yok; acil fikir araştırması gerekli.', needsEmergencyResearch: true, problems: rejected };
    }
    const { script, caption, hashtags, problems } = buildForIdea(sel.idea, { brief: input.brief, phase: input.phase, caseNo: input.caseNo });
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
            `Faz ${input.phase} (izinli huni: ${funnels.join('/')}). İçerik türü: ${type.reason}`,
            ...(sel.idea.topic ? [`Kanca adayları: ${(('hook_candidates' in script ? script.hook_candidates : undefined) ?? []).map((h: { hook: string; score: number }) => `"${h.hook}" (${h.score})`).join(', ')}`] : []),
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
