import { createClient } from '@supabase/supabase-js';
import { requireEnv, type Job } from './env.ts';

// Service role istemcisi: yalnızca GitHub Actions içinde kullanılır, tarayıcıya asla gitmez.
export function serviceClient(job: Job) {
  const env = requireEnv(job);
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
