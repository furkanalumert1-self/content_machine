// Telegram'daki Onayla/Reddet basışlarını okur ve uygular. Yayın kontrolünden hemen önce çalışır.
// (Telegram basışları 24 saat saklar; yayın aralıkları bu sürenin içinde kalır.)
// Çalıştırma: npx tsx src/jobs/telegram-poll.ts
import { callbackKey, handleUpdate } from '../approvals/telegram-approval.ts';
import { serviceClient } from '../lib/db.ts';
import { createLogger } from '../lib/logger.ts';
import { TelegramApi } from '../notify/telegram.ts';

const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat, TOKEN_ENCRYPTION_KEY: secret } = process.env;
if (!token || !chat || !secret) {
  console.log('Telegram tanımlı değil; onay basışları okunmadı.');
  process.exit(0);
}

const db = serviceClient('publisher');
const log = createLogger('telegram', db);
const tg = new TelegramApi(token);
const { data: s } = await db.from('app_settings').select('telegram_update_offset').single();
let offset = Number(s?.telegram_update_offset ?? 0);

const updates = await tg.getUpdates(offset);
for (const u of updates) {
  const result = await handleUpdate(u, {
    ownerChatId: chat,
    key: callbackKey(secret),
    async loadVideo(id) {
      const { data } = await db.from('videos').select('id, status, content_hash, publish_at').eq('id', id).maybeSingle();
      return data;
    },
    async setStatus(id, status) {
      const { data, error } = await db.from('videos').update({ status }).eq('id', id).eq('status', 'ready').select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw new Error('Video bu arada değişti; işlem yapılmadı.');
    },
    answer: async (id, text) => { await tg.answerCallback(id, text).catch(() => undefined); },
    clearButtons: async (c, m) => { await tg.clearButtons(String(c), m).catch(() => undefined); },
    reply: async (text) => { await tg.sendMessage(chat, text).catch(() => undefined); },
  });
  if (result === 'approved' || result === 'rejected') await log.info(`Telegram: video ${result === 'approved' ? 'onaylandı' : 'reddedildi'}.`, { update: u.update_id });
  else if (result === 'ignored_foreign') await log.warn('Telegram: sahibi olmayan bir hesaptan düğme basışı yok sayıldı.');
  offset = u.update_id + 1;
}
if (updates.length) await db.from('app_settings').update({ telegram_update_offset: offset }).eq('id', 1);
