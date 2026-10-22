// Log ve bildirimlere gizli değer gitmesin diye metni maskeler.

const SECRET_ENV_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'INSTAGRAM_APP_SECRET',
  'GH_PRODUCT_READ_TOKEN',
  'GH_DISPATCH_TOKEN',
  'VERCEL_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'TOKEN_ENCRYPTION_KEY',
];

const PATTERNS: RegExp[] = [
  /\b(?:IG|EAA)[A-Za-z0-9_-]{20,}/g, // Meta / Instagram erişim anahtarları
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g, // GitHub token
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT (Supabase anahtarları)
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}/g, // Supabase yeni anahtar biçimi
  /\b\d{6,}:[A-Za-z0-9_-]{30,}/g, // Telegram bot token
  /([?&](access_token|client_secret|token)=)[^&\s"]+/gi,
  /(authorization:\s*(bearer|token)\s+)[^\s"]+/gi,
];

export function redact(input: string, env: Record<string, string | undefined> = process.env): string {
  let out = input;
  for (const name of SECRET_ENV_NAMES) {
    const value = env[name];
    if (value && value.length >= 8) out = out.split(value).join(`[${name}]`);
  }
  for (const re of PATTERNS) {
    out = out.replace(re, (match, prefix) =>
      typeof prefix === 'string' && match.startsWith(prefix) ? `${prefix}[GİZLİ]` : '[GİZLİ]',
    );
  }
  return out;
}

export function redactDeep<T>(value: T, env?: Record<string, string | undefined>): T {
  return JSON.parse(redact(JSON.stringify(value ?? null), env)) as T;
}
