import { describe, expect, it } from 'vitest';
import { MissingEnvError, requireEnv, serviceKeyProblem, WrongKeyError } from '../src/lib/env.ts';

describe('requireEnv', () => {
  it('eksik değişkenlerin yalnızca adını bildirir', () => {
    try {
      requireEnv('publisher', { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: '  ' });
      throw new Error('hata bekleniyordu');
    } catch (e) {
      expect(e).toBeInstanceOf(MissingEnvError);
      expect((e as MissingEnvError).missing).toEqual(['SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY']);
      expect((e as Error).message).not.toContain('supabase.co');
    }
  });

  it('tamamsa yalnızca o işin değişkenlerini döndürür', () => {
    const env = { SUPABASE_URL: ' u ', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_k\n', VERCEL_TOKEN: 'v' };
    expect(requireEnv('planner', env)).toEqual({ SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_k' });
  });

  it('service role yerine herkese açık anahtar verilirse değeri yazmadan açıkça söyler', () => {
    const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.y`;
    expect(serviceKeyProblem('sb_secret_abc')).toBeNull();
    expect(serviceKeyProblem(jwt('service_role'))).toBeNull();
    expect(serviceKeyProblem('sb_publishable_abc')).toContain('Publishable');
    expect(serviceKeyProblem(jwt('anon'))).toContain('anon');
    expect(serviceKeyProblem('rastgele')).toContain('Tanınmayan');
    try {
      requireEnv('planner', { SUPABASE_URL: 'u', SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_GIZLI123' });
      throw new Error('hata bekleniyordu');
    } catch (e) {
      expect(e).toBeInstanceOf(WrongKeyError);
      expect((e as Error).message).not.toContain('GIZLI123');
    }
  });
});
