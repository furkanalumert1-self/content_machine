// Instagram token'ı veritabanında AES-256-GCM ile şifreli tutulur. Anahtar yalnızca sunucu ortamında (TOKEN_ENCRYPTION_KEY).
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export function keyFrom(raw: string | undefined): Buffer {
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY tanımlı değil.');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY 32 bayt olmalı (64 hex veya base64). Üretmek için README > Gizli anahtarlar.');
  return key;
}

export function encryptToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

export function decryptToken(stored: string, key: Buffer): string {
  const [v, iv, tag, data] = stored.split(':');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Şifreli token biçimi tanınmadı.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
