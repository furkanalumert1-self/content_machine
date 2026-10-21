// Telegram üzerinden onay/ret. Güvenlik:
// - Düğme verisi HMAC ile imzalıdır ve videonun içerik özetine bağlıdır: içerik sonradan değişirse eski düğme geçersizdir.
// - Yalnızca sahibin Telegram kimliğinden (TELEGRAM_CHAT_ID) gelen basışlar işlenir.
// - Yalnızca "ready" durumundaki video onaylanabilir; onay veritabanı kuralıyla da korunur.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { InlineButton, TelegramUpdate } from '../notify/telegram.ts';

export type Action = 'a' | 'r'; // onayla / reddet

export function callbackKey(secret: string): Buffer {
  return createHash('sha256').update(`telegram-callback:${secret}`).digest();
}

const sig = (key: Buffer, action: Action, videoId: string, contentHash: string) =>
  createHmac('sha256', key).update(`${action}|${videoId}|${contentHash}`).digest('hex').slice(0, 16);

/** "a:<uuid>:<16 hex>" = 55 bayt (Telegram sınırı 64). */
export function buildButtons(key: Buffer, videoId: string, contentHash: string): InlineButton[][] {
  return [[
    { text: '✅ Onayla', callback_data: `a:${videoId}:${sig(key, 'a', videoId, contentHash)}` },
    { text: '❌ Reddet', callback_data: `r:${videoId}:${sig(key, 'r', videoId, contentHash)}` },
  ]];
}

export function parseCallback(data: string | undefined): { action: Action; videoId: string; signature: string } | null {
  const m = data?.match(/^([ar]):([0-9a-f-]{36}):([0-9a-f]{16})$/);
  return m ? { action: m[1] as Action, videoId: m[2], signature: m[3] } : null;
}

export interface VideoState { id: string; status: string; content_hash: string; publish_at: string | null }

export interface ApprovalDeps {
  ownerChatId: string;
  key: Buffer;
  loadVideo(id: string): Promise<VideoState | null>;
  setStatus(id: string, status: 'approved' | 'rejected'): Promise<void>;
  answer(callbackId: string, text: string): Promise<void>;
  clearButtons(chatId: number, messageId: number): Promise<void>;
  reply(text: string): Promise<void>;
}

export type HandleResult = 'approved' | 'rejected' | 'ignored_foreign' | 'invalid' | 'stale' | 'not_ready' | 'not_found' | 'no_callback';

export async function handleUpdate(u: TelegramUpdate, d: ApprovalDeps): Promise<HandleResult> {
  const cq = u.callback_query;
  if (!cq) return 'no_callback';
  // Başkasının basışı: hiçbir şey yapma, bilgi verme.
  if (String(cq.from.id) !== d.ownerChatId) return 'ignored_foreign';

  const parsed = parseCallback(cq.data);
  if (!parsed) { await d.answer(cq.id, 'Geçersiz düğme.'); return 'invalid'; }

  const video = await d.loadVideo(parsed.videoId);
  if (!video) { await d.answer(cq.id, 'Video bulunamadı.'); return 'not_found'; }

  const expected = Buffer.from(sig(d.key, parsed.action, video.id, video.content_hash));
  const given = Buffer.from(parsed.signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await d.answer(cq.id, 'Bu düğme artık geçersiz: video içeriği değişti. Güncel önizlemeyi panelden onaylayın.');
    if (cq.message) await d.clearButtons(cq.message.chat.id, cq.message.message_id);
    return 'stale';
  }
  if (video.status !== 'ready') {
    await d.answer(cq.id, `İşlem yapılmadı: video durumu "${video.status}".`);
    if (cq.message) await d.clearButtons(cq.message.chat.id, cq.message.message_id);
    return 'not_ready';
  }

  const status = parsed.action === 'a' ? 'approved' : 'rejected';
  await d.setStatus(video.id, status);
  await d.answer(cq.id, status === 'approved' ? 'Onaylandı ✅' : 'Reddedildi ❌');
  if (cq.message) await d.clearButtons(cq.message.chat.id, cq.message.message_id);
  await d.reply(status === 'approved'
    ? `✅ Onaylandı. Planlanan yayın: ${video.publish_at ? formatIstanbul(video.publish_at) : 'saat seçilmedi'} (sonraki yayın kontrolünde; birkaç dakika gecikebilir).`
    : '❌ Reddedildi. Bu video yayınlanmayacak.');
  return status;
}

export function formatIstanbul(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/** Hazır video için onay mesajı metni (video ayrıca önizleme olarak gönderilir). */
export function readyMessage(v: { caption: string; hashtags: string[]; publish_at: string | null; publish_at_reason: string | null; plan_reason: string | null; duration_sec: number; review_notes: string[] }): string {
  return [
    '🎬 Yeni video onay bekliyor',
    `Süre: ${v.duration_sec} sn · Planlanan: ${v.publish_at ? formatIstanbul(v.publish_at) : '—'}`,
    '',
    '— Caption —',
    v.caption,
    v.hashtags.join(' '),
    '',
    `Saat gerekçesi: ${v.publish_at_reason ?? '—'}`,
    ...(v.review_notes.length ? ['', `⚠️ ${v.review_notes.join(' ')}`] : []),
    '',
    'Onaylamazsanız yayınlanmaz. Düzenleme/saat değişikliği panelden.',
  ].join('\n');
}
