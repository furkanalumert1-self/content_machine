import { describe, expect, it } from 'vitest';
import { redact, redactDeep } from '../src/lib/redact.ts';

describe('redact', () => {
  it('ortam değişkenindeki gizli değeri adıyla değiştirir', () => {
    const env = { VERCEL_TOKEN: 'abcDEF1234567890' };
    expect(redact('hata: abcDEF1234567890 geçersiz', env)).toBe('hata: [VERCEL_TOKEN] geçersiz');
  });

  it('bilinen token biçimlerini maskeler', () => {
    const samples = [
      'IGAAb' + 'x'.repeat(40),
      'EAAG' + 'y'.repeat(40),
      'ghp_' + 'a'.repeat(36),
      'github_pat_' + 'b'.repeat(40),
      'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZSJ9.c2lnbmF0dXJlLXZhbHVl',
      '123456789:' + 'Q'.repeat(35),
      'sb_secret_' + 'k'.repeat(30),
    ];
    for (const s of samples) expect(redact(`x ${s} y`, {})).toBe('x [GİZLİ] y');
  });

  it('URL parametresi ve Authorization başlığındaki değeri maskeler, adı korur', () => {
    expect(redact('GET /me?fields=id&access_token=SECRET123', {})).toBe('GET /me?fields=id&access_token=[GİZLİ]');
    expect(redact('Authorization: Bearer abc.def', {})).toBe('Authorization: Bearer [GİZLİ]');
  });

  it('kısa ve zararsız metne dokunmaz', () => {
    expect(redact('Video 3 hazır, süre 30 sn', { VERCEL_TOKEN: 'abc' })).toBe('Video 3 hazır, süre 30 sn');
  });

  it('iç içe nesnelerde de çalışır', () => {
    const out = redactDeep({ a: { url: 'https://x?token=zzz' }, list: ['ghp_' + 'c'.repeat(36)] }, {});
    expect(out).toEqual({ a: { url: 'https://x?token=[GİZLİ]' }, list: ['[GİZLİ]'] });
  });
});
