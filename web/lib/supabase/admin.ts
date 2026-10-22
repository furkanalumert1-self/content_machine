import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { need } from '../env';

/**
 * Service role istemcisi: RLS'yi aşar. YALNIZCA requireAdmin() sonrasında ve yalnızca
 * kullanıcının kendi yetkisiyle yapamayacağı işler için (Instagram token kaydı, imzalı video URL'si).
 */
export function adminClient() {
  return createClient(need('NEXT_PUBLIC_SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
