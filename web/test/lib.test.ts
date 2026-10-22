import { describe, expect, it } from 'vitest';
import { STATUS, toLocalInput } from '../lib/format';
import { fail, text, uuid } from '../lib/validate';
import { originOf } from '../lib/origin';

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

describe('validate', () => {
  it('geçerli uuid kabul, geçersiz/enjeksiyon reddedilir', () => {
    expect(uuid(fd({ id: '30000000-0000-0000-0000-000000000001' }))).toBe('30000000-0000-0000-0000-000000000001');
    expect(() => uuid(fd({ id: "1' or '1'='1" }))).toThrow('Geçersiz kimlik');
    expect(() => uuid(fd({}))).toThrow();
  });
  it('metin: kırpma, zorunlu alan, uzunluk sınırı', () => {
    expect(text(fd({ a: '  merhaba \r\n dünya ' }), 'a')).toBe('merhaba \n dünya');
    expect(() => text(fd({ a: ' ' }), 'a', { required: true })).toThrow('Zorunlu');
    expect(() => text(fd({ a: 'x'.repeat(11) }), 'a', { max: 10 })).toThrow('çok uzun');
  });
  it('hata sonucu kullanıcıya Türkçe mesaj döndürür', () => {
    expect(fail(new Error('Geçersiz kimlik.'))).toEqual({ ok: false, message: 'Geçersiz kimlik.' });
    expect(fail('x')).toEqual({ ok: false, message: 'Beklenmeyen hata.' });
  });
});

describe('format', () => {
  it('datetime-local için İstanbul saati', () => {
    expect(toLocalInput('2026-10-22T18:00:00Z')).toBe('2026-10-22T21:00');
    expect(toLocalInput(null)).toBe('');
  });
  it('her video durumunun Türkçe etiketi var', () => {
    for (const s of ['planned', 'rendering', 'render_failed', 'ready', 'approved', 'rejected', 'publishing', 'published', 'publish_failed']) expect(STATUS[s]?.label).toBeTruthy();
  });
});

describe('originOf', () => {
  const req = (h: Record<string, string>, url = 'http://localhost:3000/x') => ({ headers: new Headers(h), nextUrl: new URL(url) }) as never;
  it('Host başlığını kullanır (localhost\'a yanlış yönlendirme olmaz)', () => {
    expect(originOf(req({ host: '127.0.0.1:3000' }))).toBe('http://127.0.0.1:3000');
  });
  it('Vercel arkasında x-forwarded-* başlıklarını kullanır', () => {
    expect(originOf(req({ host: 'internal', 'x-forwarded-host': 'panel.vercel.app', 'x-forwarded-proto': 'https' }))).toBe('https://panel.vercel.app');
  });
});
