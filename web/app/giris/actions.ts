'use server';
import { redirect } from 'next/navigation';
import { userClient } from '@/lib/supabase/server';
import { redact } from '@content-machine/engine/lib/redact.ts';
import { optional } from '@/lib/env';

export type LoginState = { ok: boolean; message: string } | undefined;

// E-posta + şifre ile giriş. Kayıt kapalıdır; hesap Supabase panelinden elle açılır.
// Hata mesajı tektir: hesabın var olup olmadığını veya hangi alanın yanlış olduğunu ele vermez.
const WRONG = { ok: false, message: 'E-posta veya şifre hatalı.' };

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || !password || password.length > 200) return WRONG;

  // ADMIN_EMAIL dışındaki hesaplar Supabase'e hiç sorulmaz.
  const admin = optional('ADMIN_EMAIL')?.toLowerCase();
  if (admin && email !== admin) return WRONG;

  const db = await userClient();
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    if (/rate limit|too many/i.test(error.message)) return { ok: false, message: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.' };
    if (!/invalid login credentials|email not confirmed/i.test(error.message)) console.error(`Giriş başarısız: ${redact(error.message)}`);
    return WRONG;
  }
  redirect('/kuyruk');
}

export async function signOut() {
  const db = await userClient();
  await db.auth.signOut();
}
