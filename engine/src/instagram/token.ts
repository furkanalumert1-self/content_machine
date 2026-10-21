// Token yaşam döngüsü kararı. Gerçek bitiş tarihi her zaman API'nin döndürdüğü expires_in'den hesaplanır.
// Meta: uzun ömürlü token en az 24 saatlik ve süresi dolmamışsa yenilenebilir.

export const WARN_DAYS = 7;
export const REFRESH_AFTER_DAYS = 7; // haftada bir yenile (Meta 24 saatten sonra izin veriyor)
const DAY = 86_400_000;

export type TokenAction =
  | { action: 'ok'; daysLeft: number }
  | { action: 'refresh'; daysLeft: number }
  | { action: 'expired' };

export function decideToken(conn: { token_expires_at: string; last_refreshed_at: string | null; connected_at: string }, now = new Date()): TokenAction {
  const left = new Date(conn.token_expires_at).getTime() - now.getTime();
  if (left <= 0) return { action: 'expired' };
  const age = now.getTime() - new Date(conn.last_refreshed_at ?? conn.connected_at).getTime();
  const daysLeft = Math.floor(left / DAY);
  return age >= REFRESH_AFTER_DAYS * DAY || (left < WARN_DAYS * DAY && age >= DAY) ? { action: 'refresh', daysLeft } : { action: 'ok', daysLeft };
}

export const needsWarning = (daysLeft: number) => daysLeft < WARN_DAYS;
