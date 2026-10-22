import 'server-only';

// Sunucu tarafı ortam değişkenleri. Eksikse değerini değil adını söyler.
// NEXT_PUBLIC_ önekli olanlar dışında hiçbiri tarayıcıya gitmez.
import { parseAdminEmails } from './admin-emails';

const read = (name: string) => process.env[name]?.trim() || undefined;

export function need(name: string): string {
  const v = read(name);
  if (!v) throw new Error(`Eksik ortam değişkeni: ${name}. Vercel > Settings > Environment Variables (docs/kurulum/supabase-vercel.md).`);
  return v;
}

export const optional = read;

export const publicSupabase = () => ({ url: need('NEXT_PUBLIC_SUPABASE_URL'), anonKey: need('NEXT_PUBLIC_SUPABASE_ANON_KEY') });

/** Panelde hangi entegrasyonların yapılandırıldığını gösterir (değerleri değil). */
export function integrationStatus() {
  const has = (...names: string[]) => names.every((n) => !!read(n));
  return {
    instagram: has('INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'INSTAGRAM_REDIRECT_URI', 'TOKEN_ENCRYPTION_KEY'),
    githubDispatch: has('GH_DISPATCH_TOKEN', 'GH_AUTOMATION_REPO'),
    githubProductRead: has('GH_PRODUCT_READ_TOKEN'),
    vercel: has('VERCEL_TOKEN'),
    telegram: has('TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'),
  };
}

/** Panele girebilecek e-postalar (ADMIN_EMAIL). Boş liste = kısıt yok, yalnızca veritabanındaki admins tablosu geçerli. */
export const adminEmails = () => parseAdminEmails(process.env.ADMIN_EMAIL);
