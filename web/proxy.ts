import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// İyimser kontrol: Supabase oturum çerezini tazeler, oturumu olmayanı girişe yönlendirir.
// Asıl yetki kontrolü lib/dal.ts ve veritabanı RLS'sindedir.
const PUBLIC = ['/giris', '/auth/callback'];

export default async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res; // kurulum eksik: sayfalar anlaşılır hata gösterir

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) res.headers.set(k, v);
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();

  const isPublic = PUBLIC.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!user && !isPublic) {
    const to = req.nextUrl.clone();
    to.pathname = '/giris';
    to.search = '';
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
