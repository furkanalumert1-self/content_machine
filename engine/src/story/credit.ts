// ElevenLabs kalan karakter kredisi: azaldığında panel ve Telegram uyarısı için.
// Anahtar yalnızca ortam değişkeninden okunur; yanıttan yalnızca sayılar alınır, hiçbir şey loglanmaz.

/** Bir hikâye videosunun ortalama seslendirme maliyeti (karakter); süre aşımında yeniden seslendirme payı dahil. */
export const CHARS_PER_VIDEO = 1100;
/** Kredi yenilenmeden önce bu kadar günden az üretim kaldıysa uyarılır. */
export const WARN_DAYS = 10;

export interface Subscription { character_count: number; character_limit: number; next_character_count_reset_unix?: number | null }

export type CreditStatus =
  | { kind: 'ok' | 'low'; remaining: number; limit: number; videosLeft: number; resetAt: Date | null }
  | { kind: 'no_permission' }
  | { kind: 'error'; message: string };

/** Kalan krediyi günlük video sayısına göre yorumlar. Yenileme tarihi bitişten önceyse uyarmaz. */
export function creditVerdict(sub: Subscription, dailyVideos: number, now = new Date()): CreditStatus {
  const remaining = Math.max(0, sub.character_limit - sub.character_count);
  const videosLeft = Math.floor(remaining / CHARS_PER_VIDEO);
  const resetAt = sub.next_character_count_reset_unix ? new Date(sub.next_character_count_reset_unix * 1000) : null;
  const daysLeft = videosLeft / Math.max(1, dailyVideos);
  const daysToReset = resetAt ? (resetAt.getTime() - now.getTime()) / 86_400_000 : Infinity;
  const low = daysLeft < WARN_DAYS && daysToReset > daysLeft;
  return { kind: low ? 'low' : 'ok', remaining, limit: sub.character_limit, videosLeft, resetAt };
}

export async function checkCredit(dailyVideos: number, opts: { apiKey?: string; fetchImpl?: typeof fetch } = {}): Promise<CreditStatus> {
  const key = opts.apiKey ?? process.env.ELEVENLABS_API_KEY;
  if (!key) return { kind: 'error', message: 'ELEVENLABS_API_KEY tanımlı değil.' };
  try {
    const res = await (opts.fetchImpl ?? fetch)('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': key } });
    if (res.status === 401 || res.status === 403) {
      const body = await res.json().catch(() => ({})) as { detail?: { status?: string } };
      if (body.detail?.status === 'missing_permissions') return { kind: 'no_permission' };
      return { kind: 'error', message: `ElevenLabs kredi sorgusu reddedildi (HTTP ${res.status}).` };
    }
    if (!res.ok) return { kind: 'error', message: `ElevenLabs kredi sorgusu başarısız (HTTP ${res.status}).` };
    return creditVerdict(await res.json() as Subscription, dailyVideos);
  } catch (e) {
    return { kind: 'error', message: `ElevenLabs kredi sorgusu yapılamadı: ${(e as Error).message}` };
  }
}

const fmt = (n: number) => n.toLocaleString('tr-TR');
const day = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' });

/** Kullanıcıya gösterilecek kısa Türkçe metin. */
export function creditMessage(s: CreditStatus): string {
  switch (s.kind) {
    case 'ok':
    case 'low': {
      const base = `ElevenLabs kredisi: ${fmt(s.remaining)} / ${fmt(s.limit)} karakter kaldı (yaklaşık ${s.videosLeft} video)${s.resetAt ? `; yenilenme ${day(s.resetAt)}` : ''}.`;
      return s.kind === 'low' ? `${base} Azalıyor: yenilenmeden önce bitebilir, planı yükseltmeyi veya ek kredi almayı düşünün.` : base;
    }
    case 'no_permission':
      return 'ElevenLabs kredisi okunamıyor: API anahtarında "User → Read" izni kapalı. ElevenLabs → Developers → API Keys bölümünden bu izni açın.';
    case 'error':
      return s.message;
  }
}
