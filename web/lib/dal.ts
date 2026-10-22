import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { adminEmails } from './env';
import { userClient } from './supabase/server';

export class Unauthorized extends Error {}

/**
 * Yetki kontrolünün asıl yeri (Data Access Layer). Her sayfa, sunucu eylemi ve route handler çağırır.
 * Proxy yalnızca hızlı yönlendirme yapar; güvenlik burada ve veritabanı RLS'sinde.
 * Koşullar: geçerli oturum + admins tablosunda kayıt + (tanımlıysa) ADMIN_EMAIL listesinde olma.
 */
async function check() {
  const db = await userClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false as const, reason: 'oturum yok' };
  const allowed = adminEmails();
  if (allowed.length && !allowed.includes(user.email?.toLowerCase() ?? '')) return { ok: false as const, reason: 'yetkisiz hesap' };
  const { data: isAdmin } = await db.rpc('is_admin');
  if (!isAdmin) return { ok: false as const, reason: 'yönetici değil' };
  return { ok: true as const, db, user: { id: user.id, email: user.email ?? '' } };
}

const cachedCheck = cache(check);

/** Sayfalar için: yetkisizse giriş sayfasına yönlendirir. */
export async function requireAdminPage() {
  const r = await cachedCheck();
  if (!r.ok) redirect(`/giris?neden=${encodeURIComponent(r.reason)}`);
  return r;
}

/** Sunucu eylemleri ve route handler'lar için: yetkisizse hata fırlatır (render dışı çağrılar önbelleksiz). */
export async function requireAdmin() {
  const r = await check();
  if (!r.ok) throw new Unauthorized(`Yetkisiz: ${r.reason}`);
  return r;
}
