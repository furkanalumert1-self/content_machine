'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/dal';
import { adminClient } from '@/lib/supabase/admin';
import { fail, type ActionResult } from '@/lib/validate';

const done = (message: string): ActionResult => { revalidatePath('/', 'layout'); return { ok: true, message }; };

export async function setPaused(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const paused = form.get('paused') === 'true';
    const { db } = await requireAdmin();
    const { error } = await db.from('app_settings').update({ paused }).eq('id', 1);
    if (error) throw new Error(error.message);
    return done(paused ? 'DURDURULDU: hiçbir video yayınlanmayacak (yayından hemen önce de kontrol edilir).' : 'Yayın yeniden açıldı.');
  } catch (e) { return fail(e); }
}

export async function setMode(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const mode = String(form.get('mode'));
    if (!['approval', 'auto'].includes(mode)) throw new Error('Geçersiz mod.');
    if (mode === 'auto' && form.get('confirm') !== 'evet') return { ok: false, message: 'Otomatik mod için onay kutusunu işaretleyin.' };
    const { db } = await requireAdmin();
    const { error } = await db.from('app_settings').update({ mode }).eq('id', 1);
    if (error) return { ok: false, message: error.message.replace(/^.*?:\s*/, '') };
    return done(mode === 'auto' ? 'Otomatik mod açık: kalite kontrolünden geçen videolar onaysız yayınlanır.' : 'Onaylı mod: onaylamadığınız video yayınlanmaz.');
  } catch (e) { return fail(e); }
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export async function setSchedule(_: ActionResult, form: FormData): Promise<ActionResult> {
  try {
    const count = Number(form.get('daily_video_count'));
    if (!Number.isInteger(count) || count < 1 || count > 3) throw new Error('Günlük video sayısı 1–3 olmalı.');
    const windows = [1, 2].map((i) => ({ start: String(form.get(`w${i}_start`) ?? ''), end: String(form.get(`w${i}_end`) ?? '') }))
      .filter((w) => w.start || w.end);
    if (!windows.length) throw new Error('En az bir yayın aralığı gerekli.');
    for (const w of windows) {
      if (!HHMM.test(w.start) || !HHMM.test(w.end) || w.start >= w.end) throw new Error('Aralıklar SS:DD biçiminde ve başlangıç < bitiş olmalı.');
    }
    const outside = windows.some((w) => !((w.start >= '08:00' && w.end <= '10:00') || (w.start >= '19:00' && w.end <= '22:45')));
    const { db } = await requireAdmin();
    const { error } = await db.from('app_settings').update({ daily_video_count: count, publish_windows: windows }).eq('id', 1);
    if (error) throw new Error(error.message);
    return done(outside
      ? 'Kaydedildi. Uyarı: yayın kontrolü yalnızca 08:07–09:52 ve 19:07–22:52 arasında çalışıyor; bu aralık dışındaki saatler için yayın kontrolü saatlerinin de (publisher.yml ve supabase/zamanlayici.sql) değişmesi gerekir.'
      : 'Kaydedildi.');
  } catch (e) { return fail(e); }
}

export async function disconnectInstagram(_: ActionResult): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await adminClient().from('instagram_connection').delete().eq('id', 1);
    if (error) throw new Error(error.message);
    return done('Instagram bağlantısı kaldırıldı; token silindi. Yayın yapılmaz.');
  } catch (e) { return fail(e); }
}
