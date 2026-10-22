import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { originOf } from '@/lib/origin';
import { exchangeCode, InstagramClient, longLivedToken, SCOPES } from '@content-machine/engine/instagram/client.ts';
import { encryptToken, keyFrom } from '@content-machine/engine/instagram/crypto.ts';
import { redact } from '@content-machine/engine/lib/redact.ts';
import { requireAdmin } from '@/lib/dal';
import { need } from '@/lib/env';
import { adminClient } from '@/lib/supabase/admin';

// Instagram dönüşü: state doğrula → kod → kısa token → 60 günlük token → hesap bilgisi → ŞİFRELİ kaydet.
// Token tarayıcıya hiç gönderilmez, loga yazılmaz; tabloya yalnızca service role erişir.
export async function GET(req: NextRequest) {
  const back = (code: string) => {
    const res = NextResponse.redirect(new URL(`/ayarlar?instagram=${code}`, originOf(req)));
    res.cookies.delete({ name: 'ig_oauth_state', path: '/api/instagram' });
    return res;
  };
  try { await requireAdmin(); } catch { return NextResponse.redirect(new URL('/giris', originOf(req))); }

  const q = req.nextUrl.searchParams;
  if (q.get('error')) return back('iptal');
  const expected = Buffer.from(req.cookies.get('ig_oauth_state')?.value ?? '');
  const given = Buffer.from(q.get('state') ?? '');
  if (!expected.length || expected.length !== given.length || !timingSafeEqual(expected, given)) return back('durum');
  const code = q.get('code');
  if (!code) return back('hata');

  try {
    const short = await exchangeCode(need('INSTAGRAM_APP_ID'), need('INSTAGRAM_APP_SECRET'), need('INSTAGRAM_REDIRECT_URI'), code);
    if (!SCOPES.every((s) => short.permissions.includes(s))) return back('izin');
    const long = await longLivedToken(need('INSTAGRAM_APP_SECRET'), short.shortToken);
    const me = await new InstagramClient(long.token).me();
    const now = new Date();
    const { error } = await adminClient().from('instagram_connection').upsert({
      id: 1, ig_user_id: String(me.user_id), username: me.username,
      access_token: encryptToken(long.token, keyFrom(need('TOKEN_ENCRYPTION_KEY'))),
      token_expires_at: new Date(now.getTime() + long.expiresIn * 1000).toISOString(),
      last_refreshed_at: now.toISOString(), connected_at: now.toISOString(), scopes: short.permissions, token_status: 'ok',
    });
    if (error) throw new Error(error.message);
    return back('baglandi');
  } catch (e) {
    console.error(`Instagram bağlantı hatası: ${redact((e as Error).message)}`);
    return back('hata');
  }
}
