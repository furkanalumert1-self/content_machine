// Sunucu eylemlerinde FormData doğrulama yardımcıları (girdi güvenilmezdir).
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(form: FormData, key = 'id'): string {
  const v = String(form.get(key) ?? '');
  if (!UUID.test(v)) throw new Error('Geçersiz kimlik.');
  return v;
}

export function text(form: FormData, key: string, { max = 2000, required = false } = {}): string {
  const v = String(form.get(key) ?? '').replace(/\r\n/g, '\n').trim();
  if (required && !v) throw new Error('Zorunlu alan boş.');
  if (v.length > max) throw new Error(`Metin çok uzun (en fazla ${max} karakter).`);
  return v;
}

export type ActionResult = { ok: boolean; message: string } | undefined;
export const fail = (e: unknown): ActionResult => ({ ok: false, message: e instanceof Error ? e.message : 'Beklenmeyen hata.' });
