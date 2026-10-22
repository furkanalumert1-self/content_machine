'use server';
import { revalidatePath } from 'next/cache';
import { checkClaims } from '@content-machine/engine/content/claims.ts';
import { CONTENT_TYPES, type ContentType } from '@content-machine/engine/ideas/types.ts';
import { requireAdmin } from '@/lib/dal';
import { dispatch } from '@/lib/github';
import { fail, text, uuid, type ActionResult } from '@/lib/validate';

export async function addIdea(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const productId = uuid(form, 'product_id');
    const idea = text(form, 'idea', { required: true, max: 400 });
    const hook = text(form, 'hook', { required: true, max: 90 });
    const why = text(form, 'why', { max: 300 }) || 'Elle eklendi.';
    const type = String(form.get('content_type'));
    if (!CONTENT_TYPES.includes(type as ContentType)) throw new Error('Geçersiz içerik türü.');
    if (hook.split(/\s+/).length > 10) return { ok: false, message: 'Hook en fazla 10 kelime olmalı (ilk 2 saniye).' };
    const issues = checkClaims(`${idea} ${hook}`);
    if (issues.length) return { ok: false, message: `Kabul edilmedi:\n• ${issues.map((i) => `${i.rule}: "${i.match}"`).join('\n• ')}` };
    const { db } = await requireAdmin();
    const { error } = await db.from('ideas').insert({ product_id: productId, idea, hook, content_type: type, source: 'manual', score: 75, why });
    if (error) throw new Error(error.code === '23505' ? 'Bu fikir zaten var.' : error.message);
    revalidatePath('/fikirler');
    return { ok: true, message: 'Fikir eklendi.' };
  } catch (e) { return fail(e); }
}

export async function deleteIdea(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const { db } = await requireAdmin();
    const { error } = await db.from('ideas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/fikirler');
    return { ok: true, message: 'Silindi.' };
  } catch (e) { return fail(e); }
}

export async function runResearch(_: ActionResult): Promise<ActionResult> {
  try {
    await requireAdmin();
    const d = await dispatch('ideas.yml');
    return { ok: d.ok, message: d.message };
  } catch (e) { return fail(e); }
}
