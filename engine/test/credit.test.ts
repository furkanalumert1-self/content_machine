import { describe, expect, it } from 'vitest';
import { checkCredit, creditMessage, creditVerdict } from '../src/story/credit.ts';

const now = new Date('2026-10-28T09:00:00Z');
const inDays = (d: number) => Math.floor(now.getTime() / 1000 + d * 86_400);

describe('ElevenLabs kredi uyarısı', () => {
  it('bol kredide uyarmaz', () => {
    const v = creditVerdict({ character_count: 10_000, character_limit: 100_000, next_character_count_reset_unix: inDays(20) }, 2, now);
    expect(v.kind).toBe('ok');
  });
  it('yenilenmeden önce bitecekse uyarır', () => {
    const v = creditVerdict({ character_count: 85_000, character_limit: 100_000, next_character_count_reset_unix: inDays(20) }, 2, now);
    expect(v).toMatchObject({ kind: 'low', remaining: 15_000, videosLeft: 13 });
    expect(creditMessage(v)).toContain('Azalıyor');
  });
  it('yenileme bitişten önceyse uyarmaz', () => {
    const v = creditVerdict({ character_count: 85_000, character_limit: 100_000, next_character_count_reset_unix: inDays(3) }, 2, now);
    expect(v.kind).toBe('ok');
  });
  it('izin eksikse bunu ayrıca bildirir, anahtarı mesaja koymaz', async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ detail: { status: 'missing_permissions' } }), { status: 401 })) as typeof fetch;
    const s = await checkCredit(2, { apiKey: 'sk_gizli', fetchImpl });
    expect(s.kind).toBe('no_permission');
    expect(creditMessage(s)).toContain('User → Read');
    expect(creditMessage(s)).not.toContain('sk_gizli');
  });
});
