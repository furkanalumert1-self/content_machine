'use server';
import { headers } from 'next/headers';
import { userClient } from '@/lib/supabase/server';
import { redact } from '@content-machine/engine/lib/redact.ts';
import { optional } from '@/lib/env';

export type LoginState = { ok: boolean; message: string } | undefined;

// Şifresiz giriş: e-postaya tek kullanımlık bağlantı. Kayıt kapalıdır (shouldCreateUser: false);
// var olmayan hesaba bağlantı gönderilmez. Yanıt, hesabın var olup olmadığını ele vermez.
export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: 'Geçerli bir e-posta adresi girin.' };

  const admin = optional('ADMIN_EMAIL')?.toLowerCase();
  const generic = { ok: true, message: 'Hesap yetkiliyse giriş bağlantısı e-postanıza gönderildi. Gelen kutunuzu (ve gereksiz klasörünü) kontrol edin.' };
  if (admin && email !== admin) return generic;

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const db = await userClient();
  const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` } });
  if (error && !/signups not allowed|user not found/i.test(error.message)) {
    console.error(`Giriş bağlantısı gönderilemedi: ${redact(error.message)}`);
    return { ok: false, message: 'Bağlantı gönderilemedi. Birkaç dakika sonra tekrar deneyin.' };
  }
  return generic;
}

export async function signOut() {
  const db = await userClient();
  await db.auth.signOut();
}
