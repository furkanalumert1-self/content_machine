import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { originOf } from '@/lib/origin';
import { authorizeUrl } from '@content-machine/engine/instagram/client.ts';
import { requireAdmin } from '@/lib/dal';
import { optional } from '@/lib/env';

// "Instagram'ı bağla": yalnızca yönetici. CSRF koruması için tek kullanımlık state çerezi.
export async function GET(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.redirect(new URL('/giris', originOf(req))); }
  const appId = optional('INSTAGRAM_APP_ID');
  const redirectUri = optional('INSTAGRAM_REDIRECT_URI');
  if (!appId || !redirectUri || !optional('INSTAGRAM_APP_SECRET') || !optional('TOKEN_ENCRYPTION_KEY')) {
    return NextResponse.redirect(new URL('/ayarlar?instagram=ayar', originOf(req)));
  }
  const state = randomBytes(24).toString('hex');
  const res = NextResponse.redirect(authorizeUrl(appId, redirectUri, state));
  res.cookies.set('ig_oauth_state', state, { httpOnly: true, secure: originOf(req).startsWith('https:'), sameSite: 'lax', path: '/api/instagram', maxAge: 600 });
  return res;
}
