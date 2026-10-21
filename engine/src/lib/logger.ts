import type { SupabaseClient } from '@supabase/supabase-js';
import { notify } from '../notify/telegram.ts';
import { redact, redactDeep } from './redact.ts';

type Level = 'info' | 'warn' | 'error';

export function createLogger(job: string, db?: SupabaseClient) {
  async function write(level: Level, message: string, context: Record<string, unknown> = {}) {
    const msg = redact(message);
    const ctx = redactDeep(context);
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${job}: ${msg}`;
    (level === 'error' ? console.error : console.log)(line, Object.keys(ctx).length ? JSON.stringify(ctx) : '');
    if (db) {
      const { error } = await db.from('logs').insert({ level, job, message: msg, context: ctx });
      if (error) console.error(`Log veritabanına yazılamadı: ${redact(error.message)}`);
    }
    // context.notify: kullanıcıya Telegram bildirimi (maskelenmiş metin; Telegram tanımlı değilse atlanır)
    if (ctx.notify === true) await notify(`${level === 'error' ? '🚨' : '⚠️'} ${job}: ${msg}`);
  }
  return {
    info: (m: string, c?: Record<string, unknown>) => write('info', m, c),
    warn: (m: string, c?: Record<string, unknown>) => write('warn', m, c),
    error: (m: string, c?: Record<string, unknown>) => write('error', m, c),
  };
}
