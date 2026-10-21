// Telegram Bot API: bildirim ve onay mesajları. Gönderilen her metin maskelenir (token/anahtar sızmaz).
import { redact } from '../lib/redact.ts';

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export const MAX_TEXT = 4096;          // sendMessage sınırı
export const MAX_VIDEO_URL_BYTES = 20 * 1024 * 1024; // URL ile gönderim sınırı

export interface InlineButton { text: string; callback_data: string }

export class TelegramApi {
  constructor(private readonly token: string, private readonly fetcher: Fetcher = fetch) {}

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    let res: Response;
    try {
      res = await this.fetcher(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    } catch (e) {
      throw new Error(`Telegram'a ulaşılamadı: ${redact((e as Error).message)}`);
    }
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
    if (!json.ok) throw new Error(`Telegram ${method} hatası: ${redact(json.description ?? String(res.status))}`);
    return json.result as T;
  }

  sendMessage(chatId: string, text: string, buttons?: InlineButton[][]) {
    return this.call<{ message_id: number }>('sendMessage', {
      chat_id: chatId, text: clip(redact(text)), disable_web_page_preview: true,
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    });
  }

  sendVideo(chatId: string, videoUrl: string, caption: string, buttons?: InlineButton[][]) {
    return this.call<{ message_id: number }>('sendVideo', {
      chat_id: chatId, video: videoUrl, caption: clip(redact(caption), 1024), supports_streaming: true,
      ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
    });
  }

  answerCallback(id: string, text: string) {
    return this.call<boolean>('answerCallbackQuery', { callback_query_id: id, text: clip(text, 200) });
  }

  clearButtons(chatId: string, messageId: number) {
    return this.call<unknown>('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
  }

  getUpdates(offset: number) {
    return this.call<TelegramUpdate[]>('getUpdates', { offset, timeout: 0, allowed_updates: ['callback_query'] });
  }
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: { id: string; from: { id: number }; data?: string; message?: { message_id: number; chat: { id: number } } };
}

const clip = (s: string, max = MAX_TEXT) => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

/** Ortamda Telegram tanımlıysa bildirim gönderir; değilse sessizce atlar. Asla hata fırlatmaz. */
export async function notify(text: string, env: Record<string, string | undefined> = process.env, fetcher: Fetcher = fetch): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  try {
    await new TelegramApi(env.TELEGRAM_BOT_TOKEN, fetcher).sendMessage(env.TELEGRAM_CHAT_ID, redact(text, env));
    return true;
  } catch (e) {
    console.error(`Bildirim gönderilemedi: ${redact((e as Error).message, env)}`);
    return false;
  }
}
