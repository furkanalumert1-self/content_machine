import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { serviceKeyProblem } from '@content-machine/engine/lib/env.ts';
import { need } from '../env';

/**
 * Service role istemcisi: RLS'yi aşar. YALNIZCA requireAdmin() sonrasında ve yalnızca
 * kullanıcının kendi yetkisiyle yapamayacağı işler için (Instagram token kaydı, imzalı video URL'si).
 */
export function adminClient() {
  const key = need('SUPABASE_SERVICE_ROLE_KEY');
  const problem = serviceKeyProblem(key);
  if (problem) throw new Error(`SUPABASE_SERVICE_ROLE_KEY yanlış (${problem}). Vercel'de Supabase "Secret key" (sb_secret_…) olmalı; değiştirip Redeploy edin.`);
  return createClient(need('NEXT_PUBLIC_SUPABASE_URL'), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
