'use server';
import { revalidatePath } from 'next/cache';
import { activeStyles } from '@content-machine/engine/config/styles.ts';
import { checkClaims, mentionsUnverified } from '@content-machine/engine/content/claims.ts';
import { approvedBrief, listIdeas, recentExplorationFlags } from '@content-machine/engine/ideas/repo.ts';
import { ALL_CONTENT_TYPES, type ContentType, type Idea } from '@content-machine/engine/ideas/types.ts';
import { buildForIdea, planDay } from '@content-machine/engine/plan/planner.ts';
import { MAX_HOOK_WORDS, type Phase } from '@content-machine/engine/topics/channel.ts';
import type { RecentVideo } from '@content-machine/engine/plan/rotation.ts';
import { contentSentences } from '@content-machine/engine/plan/script.ts';
import { scheduleInputs } from '@content-machine/engine/schedule/repo.ts';
import { chooseSlot } from '@content-machine/engine/schedule/slots.ts';
import { requireAdmin } from '@/lib/dal';
import { dispatch } from '@/lib/github';
import { fail, text, uuid, type ActionResult } from '@/lib/validate';

const DURATIONS = new Set(['', '15', '20', '30', '45', '50', '55']);

export async function requestVideo(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const productId = uuid(form, 'product_id');
    const instruction = text(form, 'instruction', { max: 600 });
    const style = text(form, 'style', { required: true, max: 40 });
    const duration = String(form.get('duration') ?? '');
    const typeIn = String(form.get('content_type') ?? '');
    const now = form.get('mode') === 'now';
    if (!DURATIONS.has(duration)) throw new Error('Geçersiz süre.');
    if (!activeStyles().some((s) => s.slug === style)) throw new Error('Geçersiz stil.');
    if (typeIn && !ALL_CONTENT_TYPES.includes(typeIn as ContentType)) throw new Error('Geçersiz içerik türü.');
    const targetSec = duration ? Number(duration) : undefined;

    const { db, user } = await requireAdmin();
    const brief = await approvedBrief(db, productId);
    if (!brief) return { ok: false, message: 'Bu ürünün onaylı brief\'i yok. Önce Ürünler > Brief sayfasından onaylayın.' };
    const { data: s } = await db.from('app_settings').select('publish_windows, timezone, content_phase').single();
    const phase = (s?.content_phase ?? 1) as Phase;

    let idea: Idea;
    let reason: string;
    if (instruction) {
      // Elle talimat: ilk cümle hook, kalan cümleler sahneler. Brief dışı bilgi olduğu için gözden geçirme notu eklenir.
      const hook = instruction.split(/(?<=[.!?])\s+/)[0].trim();
      if (hook.split(/\s+/).length > MAX_HOOK_WORDS) return { ok: false, message: `İlk cümle videonun ilk 2 saniyesindeki kanca olur; en fazla ${MAX_HOOK_WORDS} kelime olmalı.` };
      const problems = [...checkClaims(instruction).map((i) => `${i.rule}: "${i.match}"`),
        ...(phase < 3 && /callypso/i.test(instruction) ? ['Faz 1–2: ürün adı videoda geçmemeli.'] : []), ...mentionsUnverified(instruction, brief.brief.unverified).map((u) => `Doğrulanmamış özellik: ${u}`)];
      if (problems.length) return { ok: false, message: `Talimat kabul edilmedi:\n• ${problems.join('\n• ')}` };
      const { data: row, error } = await db.from('ideas').insert({
        product_id: productId, idea: instruction, hook, content_type: (typeIn || (phase < 3 ? 'marka_rontgeni' : 'ipucu')) as ContentType, source: 'manual', source_ref: user.email,
        score: 75, why: 'Panelden elle istendi.', used: true, last_used_at: new Date().toISOString(),
      }).select('*').single();
      if (error) throw new Error(error.code === '23505' ? 'Bu talimatla daha önce video istenmiş.' : error.message);
      idea = row as Idea;
      reason = `Elle istendi (${user.email}): "${instruction}"`;
    } else {
      // Talimat yok: günlük planlayıcıyla aynı kurallar (tür dönüşümü, keşif, tekrar yasağı).
      const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
      const { data: recentRows } = await db.from('videos').select('product_id, content_type, style, created_at, script')
        .eq('product_id', productId).gte('created_at', since).order('created_at', { ascending: false });
      const recent: RecentVideo[] = (recentRows ?? []).map((r) => ({ product_id: r.product_id, content_type: r.content_type, style: r.style, created_at: r.created_at, sentences: r.script?.scenes ? contentSentences(r.script) : [] }));
      const result = planDay({ brief: brief.brief, ideas: await listIdeas(db, productId), recent, recentExploration: await recentExplorationFlags(db, productId), activeStyles: [style], phase });
      if (!result.ok) return { ok: false, message: `${result.reason} Fikir bankasından fikir ekleyin veya talimat yazın.` };
      idea = result.plan.idea;
      reason = `Panelden istendi, fikir sistem tarafından seçildi.\n${result.plan.reason}`;
      await db.from('ideas').update({ used: true, last_used_at: new Date().toISOString() }).eq('id', idea.id);
    }

    const { count: stories } = await db.from('videos').select('id', { count: 'exact', head: true }).eq('script->>format', 'story').neq('status', 'rejected');
    const { script, caption, hashtags, problems } = buildForIdea(idea, { brief: brief.brief, phase, targetSec, caseNo: (stories ?? 0) + 1 });
    if (problems.length) return { ok: false, message: `Senaryo kurallara uymadı:\n• ${problems.join('\n• ')}` };

    const slot = chooseSlot({ windows: s!.publish_windows, timezone: s!.timezone, now: new Date(), ...(await scheduleInputs(db)) });
    const { error } = await db.from('videos').insert({
      product_id: productId, brief_id: brief.id, idea_id: idea.id, origin: 'manual', request_instruction: instruction || null,
      style, content_type: script.content_type, duration_sec: script.duration_sec, script, caption, hashtags,
      plan_reason: reason, publish_at: slot.publishAt.toISOString(), publish_at_reason: slot.reason, status: 'planned',
    });
    if (error) throw new Error(error.message);

    revalidatePath('/kuyruk');
    if (!now) return { ok: true, message: 'Kuyruğa eklendi. Video yarın sabahki üretimde (08:41) hazırlanır; isterseniz Kuyruk sayfasından şimdi üretebilirsiniz.' };
    const d = await dispatch('daily.yml', { mode: 'render_only' });
    return { ok: true, message: `Video planlandı. ${d.message} Hazır olunca Kuyruk sayfasında ve Telegram'da onayınıza sunulur.` };
  } catch (e) { return fail(e); }
}
