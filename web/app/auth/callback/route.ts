import { NextResponse, type NextRequest } from 'next/server';
import { originOf } from '@/lib/origin';
import { userClient } from '@/lib/supabase/server';

// E-postadaki bağlantıdan dönüş: tek kullanımlık kodu oturuma çevirir (PKCE).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const to = (path: string) => NextResponse.redirect(new URL(path, originOf(req)));
  if (!code) return to('/giris?neden=bağlantı geçersiz');
  const db = await userClient();
  const { error } = await db.auth.exchangeCodeForSession(code);
  return error ? to('/giris?neden=bağlantı geçersiz') : to('/kuyruk');
}
