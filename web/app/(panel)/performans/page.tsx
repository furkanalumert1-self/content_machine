import { engagementScore } from '@content-machine/engine/metrics/insights.ts';
import { Card, Empty, Notice, PageHeader } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { CONTENT_TYPE_TR, fmtDateTime, fmtNum } from '@/lib/format';

type M = { checkpoint: number | null; views: number | null; reach: number | null; likes: number | null; saved: number | null; shares: number | null; comments: number | null };
const hourOf = (iso: string) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hourCycle: 'h23' }).format(new Date(iso)));

function groupAvg<T>(rows: T[], key: (r: T) => string, score: (r: T) => number | null) {
  const m = new Map<string, number[]>();
  for (const r of rows) { const s = score(r); if (s != null) m.set(key(r), [...(m.get(key(r)) ?? []), s]); }
  return [...m.entries()].map(([k, list]) => ({ k, n: list.length, avg: list.reduce((a, b) => a + b, 0) / list.length })).sort((a, b) => b.avg - a.avg);
}

function Bars({ title, rows, label }: { title: string; rows: { k: string; n: number; avg: number }[]; label: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.avg));
  return (
    <Card title={title}>
      {!rows.length ? <p className="text-sm text-muted">Veri yok.</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.k} className="text-sm">
              <div className="flex justify-between"><span>{label(r.k)}</span><span className="text-muted">{fmtNum(Math.round(r.avg))} · n={r.n}</span></div>
              <div className="mt-1 h-2 rounded-full bg-surface"><div className="h-2 rounded-full bg-navy-2" style={{ width: `${(r.avg / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function PerformancePage() {
  const { db } = await requireAdminPage();
  const { data } = await db.from('videos')
    .select('id, content_type, style, published_at, publish_at_reason, ig_permalink, caption, products(name), metrics(checkpoint, views, reach, likes, saved, shares, comments)')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(100);
  const rows = (data ?? []).map((v) => {
    const ms = (v.metrics as M[]) ?? [];
    const latest = [...ms].sort((a, b) => (b.checkpoint ?? 0) - (a.checkpoint ?? 0))[0] ?? null;
    return { ...v, m24: ms.find((m) => m.checkpoint === 24) ?? null, m72: ms.find((m) => m.checkpoint === 72) ?? null, score: latest ? engagementScore(latest) : null, hour: hourOf(v.published_at) };
  });
  const scored = rows.filter((r) => r.score != null).length;

  return (
    <>
      <PageHeader title="Performans" description="İzlenme, beğeni ve kaydetme; ürün, içerik türü, stil ve yayın saatine göre karşılaştırma. Etkileşim puanı = izlenme + 5×beğeni + 15×kaydetme." />
      <div className="mb-4 space-y-2">
        <Notice>Metrikler yayından 24 ve 72 saat sonra alınır; Meta verisi 48 saate kadar gecikebilir. Meta&apos;nın vermediği metrik &quot;—&quot; görünür, tahmin edilmez.</Notice>
        {scored < 8 && <Notice tone="warn">Ölçülmüş video sayısı {scored}. Karşılaştırmalar en az 8–10 videodan sonra anlamlı olur; yayın saatleri o zamana kadar deneme amaçlıdır.</Notice>}
      </div>
      {!rows.length ? <Empty title="Henüz yayınlanmış video yok." /> : (
        <>
          <div className="mb-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Bars title="Ürüne göre" rows={groupAvg(rows, (r) => ((Array.isArray(r.products) ? r.products[0] : r.products) as { name: string } | null)?.name ?? '?', (r) => r.score)} label={(k) => k} />
            <Bars title="İçerik türüne göre" rows={groupAvg(rows, (r) => r.content_type, (r) => r.score)} label={(k) => CONTENT_TYPE_TR[k] ?? k} />
            <Bars title="Stile göre" rows={groupAvg(rows, (r) => r.style, (r) => r.score)} label={(k) => k} />
            <Bars title="Yayın saatine göre" rows={groupAvg(rows, (r) => String(r.hour).padStart(2, '0'), (r) => r.score)} label={(k) => `${k}:00`} />
          </div>
          <Card title="Videolar">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm [&_td]:px-2 [&_th]:px-2 [&_td:first-child]:pl-0 [&_th:first-child]:pl-0">
                <thead className="text-xs text-muted"><tr><th className="py-2">Yayın</th><th>Tür</th><th className="text-right">İzlenme 24s / 72s</th><th className="text-right">Beğeni</th><th className="text-right">Kaydetme</th><th className="text-right">Paylaşım</th><th className="text-right">Puan</th><th>Saat gerekçesi</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-line align-top">
                      <td className="py-2">{r.ig_permalink ? <a className="underline" href={r.ig_permalink} target="_blank" rel="noreferrer">{fmtDateTime(r.published_at)}</a> : fmtDateTime(r.published_at)}</td>
                      <td>{CONTENT_TYPE_TR[r.content_type]}</td>
                      <td className="text-right">{fmtNum(r.m24?.views)} / {fmtNum(r.m72?.views)}</td>
                      <td className="text-right">{fmtNum((r.m72 ?? r.m24)?.likes)}</td>
                      <td className="text-right">{fmtNum((r.m72 ?? r.m24)?.saved)}</td>
                      <td className="text-right">{fmtNum((r.m72 ?? r.m24)?.shares)}</td>
                      <td className="text-right font-medium">{fmtNum(r.score)}</td>
                      <td className="max-w-xs text-xs text-muted">{r.publish_at_reason ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
