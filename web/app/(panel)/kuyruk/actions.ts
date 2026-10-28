'use server';
import { revalidatePath } from 'next/cache';
import { checkClaims, mentionsUnverified } from '@content-machine/engine/content/claims.ts';
import { parseBrief } from '@content-machine/engine/brief/brief.ts';
import { numbersIn } from '@content-machine/engine/topics/bank.ts';
import { CTA_KEYWORD, MAX_TAGS, MIN_TAGS, productNameAllowed, type Phase } from '@content-machine/engine/topics/channel.ts';
import type { Topic } from '@content-machine/engine/topics/types.ts';
import { chooseSlot } from '@content-machine/engine/schedule/slots.ts';
import { scheduleInputs } from '@content-machine/engine/schedule/repo.ts';
import { requireAdmin } from '@/lib/dal';
import { dispatch } from '@/lib/github';
import { fail, text, uuid, type ActionResult } from '@/lib/validate';

// Tüm eylemler: yetki (requireAdmin) + girdi doğrulama + kullanıcı yetkisiyle (RLS) güncelleme.
// Onay kuralları ayrıca veritabanı tetikleyicileriyle korunur (içerik değişince onay düşer, yalnızca 'ready' onaylanır).

async function setStatus(form: FormData, status: 'approved' | 'rejected', from: string[]): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const { db } = await requireAdmin();
    const { data, error } = await db.from('videos').update({ status }).eq('id', id).in('status', from).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) return { ok: false, message: 'Video bu işlem için uygun durumda değil (sayfayı yenileyin).' };
    revalidatePath('/kuyruk');
    return { ok: true, message: status === 'approved' ? 'Onaylandı. Planlanan saatten sonraki ilk yayın kontrolünde paylaşılacak.' : 'Reddedildi. Bu video yayınlanmayacak.' };
  } catch (e) { return fail(e); }
}

export async function approve(_: ActionResult, form: FormData): Promise<ActionResult> {
  const r = await setStatus(form, 'approved', ['ready']);
  if (!r?.ok) return r;
  try {
    // Yayın saati geçtikten sonra onaylanan video, sıradaki boş aralığa kaydırılır (iki video aynı anda paylaşılmasın).
    const id = uuid(form);
    const { db } = await requireAdmin();
    const { data: v } = await db.from('videos').select('publish_at').eq('id', id).single();
    if (v?.publish_at && new Date(v.publish_at).getTime() < Date.now() - 15 * 60_000) {
      const { data: s } = await db.from('app_settings').select('publish_windows, timezone').single();
      const inputs = await scheduleInputs(db);
      const slot = chooseSlot({ windows: s!.publish_windows, timezone: s!.timezone, now: new Date(), ...inputs, occupied: inputs.occupied?.filter((d) => d.getTime() !== new Date(v.publish_at).getTime()) });
      await db.from('videos').update({ publish_at: slot.publishAt.toISOString(), publish_at_reason: `Onay planlanan saatten sonra geldi; sıradaki boş aralığa alındı. ${slot.reason}` }).eq('id', id);
      revalidatePath('/kuyruk');
      return { ok: true, message: `Onaylandı. Planlanan saat geçtiği için ${slot.reason.split(' (İstanbul)')[0]} saatine alındı.` };
    }
  } catch (e) { return fail(e); }
  return r;
}
export const reject = async (_: ActionResult, form: FormData) => setStatus(form, 'rejected', ['ready', 'approved', 'planned', 'render_failed', 'publish_failed']);

export async function editCaption(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const caption = text(form, 'caption', { max: 2000, required: true });
    const hashtags = text(form, 'hashtags', { max: 400 }).split(/\s+/).filter(Boolean);
    const { db } = await requireAdmin();
    const { data: v } = await db.from('videos').select('status, script, ideas(topic), product_briefs(content_md)').eq('id', id).single();
    if (!v) return { ok: false, message: 'Video bulunamadı.' };
    if (['publishing', 'published'].includes(v.status)) return { ok: false, message: 'Yayınlanan/yayınlanmakta olan video düzenlenemez.' };

    const problems: string[] = [];
    // Sepet Röntgeni videoları: 3–5 hashtag, konunun kaynaklı rakamları serbest, Faz 1–2'de ürün adı yok.
    const channel = !!(v.script as { channel?: string }).channel;
    const ideaRow = (Array.isArray(v.ideas) ? v.ideas[0] : v.ideas) as { topic: Topic | null } | null;
    const sourcedNumbers = channel ? new Set((ideaRow?.topic?.facts ?? []).flatMap((f) => numbersIn(f.text))) : undefined;
    const [minTags, maxTags] = channel ? [MIN_TAGS, MAX_TAGS] : [5, 10];
    if (hashtags.length < minTags || hashtags.length > maxTags) problems.push(`Hashtag sayısı ${hashtags.length}; ${minTags}–${maxTags} olmalı.`);
    if (channel) {
      const { data: st } = await db.from('app_settings').select('content_phase').single();
      if (!productNameAllowed((st?.content_phase ?? 1) as Phase) && /callypso/i.test(`${caption} ${hashtags.join(' ')}`)) problems.push('Faz 1–2: ürün adı geçmemeli.');
      if (!caption.includes(CTA_KEYWORD)) problems.push(`Açıklamada CTA anahtar kelimesi (${CTA_KEYWORD}) kalmalı.`);
    }
    if (new Set(hashtags).size !== hashtags.length) problems.push('Tekrarlanan hashtag var.');
    for (const h of hashtags) if (!/^#[\p{L}\p{N}_]+$/u.test(h)) problems.push(`Geçersiz hashtag: ${h}`);
    const all = `${caption}\n${hashtags.join(' ')}`;
    for (const i of checkClaims(all, { sourcedNumbers })) problems.push(`${i.rule}: "${i.match}"`);
    const briefRow = (Array.isArray(v.product_briefs) ? v.product_briefs[0] : v.product_briefs) as { content_md: string } | null;
    if (briefRow) for (const u of mentionsUnverified(all, parseBrief(briefRow.content_md).unverified)) problems.push(`Doğrulanmamış özellik: ${u}`);
    if ((v.script as { sample_data?: boolean }).sample_data && !/örnek veri/i.test(caption)) problems.push('Videoda örnek veri var; caption\'da "örnek veri" notu kalmalı.');
    if (caption.length + hashtags.join(' ').length + 2 > 2200) problems.push('Caption + hashtag 2200 karakteri aşıyor.');
    if (problems.length) return { ok: false, message: `Kaydedilmedi:\n• ${problems.join('\n• ')}` };

    const { error } = await db.from('videos').update({ caption, hashtags }).eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/kuyruk');
    return { ok: true, message: v.status === 'approved' ? 'Kaydedildi. İçerik değiştiği için önceki onay geçersiz oldu; yeniden onaylayın.' : 'Kaydedildi.' };
  } catch (e) { return fail(e); }
}

export async function changeTime(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const local = text(form, 'publish_at', { required: true, max: 20 });
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Tarih/saat biçimi geçersiz.');
    // Girilen saat İstanbul saatidir (UTC+3, yaz saati uygulaması yok).
    const at = new Date(`${local}:00+03:00`);
    if (at.getTime() < Date.now() + 5 * 60_000) return { ok: false, message: 'En az 5 dakika sonrası için saat seçin.' };
    const { db, user } = await requireAdmin();
    const { data, error } = await db.from('videos')
      .update({ publish_at: at.toISOString(), publish_at_reason: `Elle değiştirildi (${user.email}, ${new Date().toISOString().slice(0, 16)} UTC). Yayın kontrolü yalnızca 08:07–09:52 ve 19:07–22:52 arasında çalışır; bu aralık dışındaki saat bir sonraki kontrolde yayınlanır.` })
      .eq('id', id).not('status', 'in', '(publishing,published)').select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) return { ok: false, message: 'Bu videonun saati değiştirilemez.' };
    revalidatePath('/kuyruk');
    revalidatePath('/takvim');
    return { ok: true, message: 'Saat güncellendi (onay korunur).' };
  } catch (e) { return fail(e); }
}

export async function regenerate(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const id = uuid(form);
    const { db } = await requireAdmin();
    const { data, error } = await db.from('videos')
      .update({ status: 'planned', render_attempts: 0, storage_path: null, file_size_bytes: null, qc: null, error: null, ig_container_id: null, publish_tries: 0 })
      .eq('id', id).in('status', ['ready', 'approved', 'rejected', 'render_failed', 'publish_failed']).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) return { ok: false, message: 'Bu video şu an yeniden üretilemez.' };
    const d = await dispatch('daily.yml', { mode: 'render_only' });
    revalidatePath('/kuyruk');
    return { ok: true, message: `Yeniden üretim kuyruğa alındı. ${d.message} Yeni video için tekrar onay gerekir.` };
  } catch (e) { return fail(e); }
}

export async function renderNow(_: ActionResult): Promise<ActionResult> {
  try {
    await requireAdmin();
    const d = await dispatch('daily.yml', { mode: 'render_only' });
    return { ok: d.ok, message: d.message };
  } catch (e) { return fail(e); }
}
