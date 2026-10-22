import type { NextRequest } from 'next/server';

/**
 * İsteğin gerçek kökeni (proxy/Vercel arkasında x-forwarded-* başlıklarıyla). Yönlendirmeler buna yapılır;
 * aksi hâlde oturum çerezinin yazıldığı alan adından farklı bir adrese gidilip oturum kaybolabilir.
 */
export function originOf(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}
