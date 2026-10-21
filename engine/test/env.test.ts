import { describe, expect, it } from 'vitest';
import { MissingEnvError, requireEnv } from '../src/lib/env.ts';

describe('requireEnv', () => {
  it('eksik değişkenlerin yalnızca adını bildirir', () => {
    try {
      requireEnv('publisher', { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: '  ' });
      throw new Error('hata bekleniyordu');
    } catch (e) {
      expect(e).toBeInstanceOf(MissingEnvError);
      expect((e as MissingEnvError).missing).toEqual(['SUPABASE_SERVICE_ROLE_KEY', 'INSTAGRAM_APP_SECRET']);
      expect((e as Error).message).not.toContain('supabase.co');
    }
  });

  it('tamamsa yalnızca o işin değişkenlerini döndürür', () => {
    const env = { SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k', VERCEL_TOKEN: 'v' };
    expect(requireEnv('planner', env)).toEqual({ SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'k' });
  });
});
