// Performans raporu (salt okuma): son N günde yayınlanan videolar ve en son metrikleri. Gizli değer yazmaz.
// Çalıştırma: npx tsx src/jobs/report.ts [gün=14]   (GitHub: "Performans raporu" iş akışı, çıktı adım özetine de yazılır)
import { appendFileSync } from 'node:fs';
import { serviceClient } from '../lib/db.ts';

const days = Number(process.argv[2] ?? 14);
const db = serviceClient('metrics');
const since = new Date(Date.now() - days * 86_400_000).toISOString();
const { data: conn } = await db.from('instagram_connection').select('username').maybeSingle();
const { data: videos, error } = await db.from('videos')
  .select('id, published_at, duration_sec, ig_permalink, script, ideas(source_ref), metrics(checkpoint, hours_after_publish, views, reach, likes, saved, shares, comments, avg_watch_time_raw)')
  .eq('status', 'published').gte('published_at', since).order('published_at');
if (error) throw error;

type M = { checkpoint: number | null; hours_after_publish: number; views: number | null; reach: number | null; likes: number | null; saved: number | null; shares: number | null; comments: number | null; avg_watch_time_raw: number | null };
const rows = (videos ?? []).map((v) => {
  const ms = [...((v.metrics as M[]) ?? [])].sort((a, b) => b.hours_after_publish - a.hours_after_publish);
  const m = ms[0];
  const s = v.script as { hook?: string; world?: string; voice?: { model?: string }; format?: string };
  const idea = (Array.isArray(v.ideas) ? v.ideas[0] : v.ideas) as { source_ref?: string } | null;
  return {
    tarih: new Date(v.published_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'short' }),
    konu: idea?.source_ref ?? '-', kanca: s?.hook ?? '-', bicim: s?.world ? `çizim:${s.world}` : s?.format ?? '-', ses: s?.voice?.model ?? '-',
    sure: v.duration_sec, saat: m?.hours_after_publish ?? null, izlenme: m?.views ?? null, erisim: m?.reach ?? null, begeni: m?.likes ?? null,
    yorum: m?.comments ?? null, kayit: m?.saved ?? null, paylasim: m?.shares ?? null, izleme_ham: m?.avg_watch_time_raw ?? null,
    link: v.ig_permalink ?? '-',
  };
});
const out = [`Hesap: @${conn?.username ?? '?'} · son ${days} gün · ${rows.length} yayın`, JSON.stringify(rows, null, 1)].join('\n');
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + out + '\n```\n');
