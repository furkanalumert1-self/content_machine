// Günde bir: Instagram token'ını gerekiyorsa yeniler; bitişe 7 günden az kaldıysa uyarır.
// Çalıştırma: npx tsx src/jobs/token-refresh.ts
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { refreshToken } from '../instagram/client.ts';
import { decryptToken, encryptToken, keyFrom } from '../instagram/crypto.ts';
import { decideToken, needsWarning } from '../instagram/token.ts';

const db = serviceClient('token_refresh');
const log = createLogger('token_refresh', db);
const key = keyFrom(process.env.TOKEN_ENCRYPTION_KEY);

const { data: conn } = await db.from('instagram_connection').select('*').maybeSingle();
if (!conn) {
  await log.info('Instagram bağlı değil.');
  process.exit(0);
}

const decision = decideToken(conn);
if (decision.action === 'expired') {
  await db.from('instagram_connection').update({ token_status: 'expired' }).eq('id', 1);
  await log.error('Instagram token süresi dolmuş. Panelden "Instagram\'ı bağla" ile yeniden bağlayın.', { notify: true });
  process.exit(1);
}

if (decision.action === 'refresh') {
  try {
    const fresh = await refreshToken(decryptToken(conn.access_token, key));
    const expires = new Date(Date.now() + fresh.expiresIn * 1000);
    await db.from('instagram_connection').update({
      access_token: encryptToken(fresh.token, key), token_expires_at: expires.toISOString(),
      last_refreshed_at: new Date().toISOString(), token_status: 'ok',
    }).eq('id', 1);
    await log.info(`Token yenilendi; yeni bitiş ${expires.toISOString().slice(0, 10)} (API'nin bildirdiği süre: ${Math.round(fresh.expiresIn / 86400)} gün).`);
  } catch (e) {
    await db.from('instagram_connection').update({ token_status: 'refresh_failed' }).eq('id', 1);
    const msg = `Token yenilenemedi: ${(e as Error).message}. Kalan süre ${decision.daysLeft} gün.`;
    if (needsWarning(decision.daysLeft)) await log.error(`${msg} Bitişe 7 günden az kaldı — panelden yeniden bağlayın.`, { notify: true });
    else await log.warn(msg);
  }
} else if (needsWarning(decision.daysLeft)) {
  await log.warn(`Instagram token ${decision.daysLeft} gün içinde bitiyor.`, { notify: true });
}
