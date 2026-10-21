// Her iş yalnızca ihtiyaç duyduğu değişkenleri ister; eksikse değerini değil adını söyler.

export const JOB_ENV = {
  planner: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  render: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  publisher: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY'],
  token_refresh: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TOKEN_ENCRYPTION_KEY'],
  metrics: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
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

export function requireEnv(job: Job, env: Record<string, string | undefined> = process.env) {
  const missing = JOB_ENV[job].filter((name) => !env[name]?.trim());
  if (missing.length) throw new MissingEnvError(missing);
  return Object.fromEntries(JOB_ENV[job].map((n) => [n, env[n] as string])) as Record<
    (typeof JOB_ENV)[typeof job][number],
    string
  >;
}
