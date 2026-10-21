// Telegram kurulumunu dener: tanımlıysa deneme mesajı gönderir, değilse eksik değişkenin adını söyler.
import { notify } from '../notify/telegram.ts';

const missing = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].filter((n) => !process.env[n]);
if (missing.length) {
  console.error(`Eksik GitHub Secret: ${missing.join(', ')} (docs/kurulum/telegram.md)`);
  process.exit(1);
}
const ok = await notify('✅ content_machine bağlantı testi: bildirimler ve onay mesajları bu sohbete gelecek.');
if (!ok) process.exit(1);
console.log('Deneme mesajı gönderildi.');
