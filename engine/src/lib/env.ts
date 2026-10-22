// Her iş yalnızca ihtiyaç duyduğu değişkenleri ister; eksikse değerini değil adını söyler.

export const JOB_ENV = {
  planner: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  render: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  publisher: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY'],
  token_refresh: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY'],
  metrics: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY'],
  // GH_PRODUCT_READ_TOKEN isteğe bağlı: herkese açık repolarda gerekmez.
  idea_research: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  product_sync: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
} as const;

export type Job = keyof typeof JOB_ENV;

export class MissingEnvError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Eksik ortam değişkenleri: ${missing.join(', ')}. README > "Gizli anahtarlar" bölümüne bakın.`);
  }
}

export class WrongKeyError extends Error {}

/** Anahtarın türüne bakar (değerini yazmaz): service role yerine herkese açık anahtar verilirse RLS her şeyi sessizce gizler. */
export function serviceKeyProblem(key: string): string | null {
  if (key.startsWith('sb_secret_')) return null;
  if (key.startsWith('sb_publishable_')) return 'Publishable key verilmiş';
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role;
      return role === 'service_role' ? null : `JWT rolü "${role}"`;
    } catch { /* aşağıda */ }
  }
  return 'Tanınmayan anahtar biçimi';
}

export function requireEnv(job: Job, env: Record<string, string | undefined> = process.env) {
  const missing = JOB_ENV[job].filter((name) => !env[name]?.trim());
  if (missing.length) throw new MissingEnvError(missing);
  const problem = serviceKeyProblem(env.SUPABASE_SERVICE_ROLE_KEY!.trim());
  if (problem) throw new WrongKeyError(`SUPABASE_SERVICE_ROLE_KEY yanlış (${problem}). Supabase → Project Settings → API Keys → "Secret key" (sb_secret_…) olmalı; GitHub Secrets'ta güncelleyin.`);
  return Object.fromEntries(JOB_ENV[job].map((n) => [n, (env[n] as string).trim()])) as Record<
    (typeof JOB_ENV)[typeof job][number],
    string
  >;
}
