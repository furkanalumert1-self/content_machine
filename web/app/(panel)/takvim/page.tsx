import Link from 'next/link';
import { Card, Empty, Notice, PageHeader, StatusBadge } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { CONTENT_TYPE_TR } from '@/lib/format';

const TZ = 'Europe/Istanbul';
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const dayLabel = (d: Date) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d);
const time = (iso: string) => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, timeStyle: 'short' }).format(new Date(iso));

export default async function CalendarPage() {
  const { db } = await requireAdminPage();
  const from = new Date(Date.now() - 14 * 86_400_000);
  const to = new Date(Date.now() + 14 * 86_400_000);
  const { data } = await db.from('videos').select('id, status, content_type, publish_at, published_at, caption')
    .or(`and(publish_at.gte.${from.toISOString()},publish_at.lte.${to.toISOString()}),and(published_at.gte.${from.toISOString()},published_at.lte.${to.toISOString()})`)
    .neq('status', 'rejected');
  const byDay = new Map<string, NonNullable<typeof data>>();
  for (const v of data ?? []) {
    const at = v.published_at ?? v.publish_at;
    if (!at) continue;
    const k = dayKey(new Date(at));
    byDay.set(k, [...(byDay.get(k) ?? []), v]);
  }
  const days = Array.from({ length: 28 }, (_, i) => new Date(from.getTime() + i * 86_400_000));
  const today = dayKey(new Date());

  return (
    <>
      <PageHeader title="Takvim" description="Son 2 hafta ve önümüzdeki 2 hafta: planlanan ve yayınlanan videolar (İstanbul saati)." />
      <div className="mb-4"><Notice>Planlanan saatler hedeftir: yayın, saatten sonraki ilk yayın kontrolünde yapılır ve birkaç dakika gecikebilir.</Notice></div>
      {!data?.length && <Empty title="Bu aralıkta video yok." />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((d) => {
          const k = dayKey(d);
          const items = (byDay.get(k) ?? []).sort((a, b) => String(a.published_at ?? a.publish_at).localeCompare(String(b.published_at ?? b.publish_at)));
          return (
            <Card key={k} className={`p-3 ${k === today ? 'ring-2 ring-cyan' : ''} ${!items.length ? 'hidden lg:block opacity-60' : ''}`}>
              <p className="mb-2 text-xs font-medium text-muted">{dayLabel(d)}{k === today && ' · bugün'}</p>
              <ul className="space-y-2">
                {items.map((v) => (
                  <li key={v.id} className="text-xs">
                    <Link href="/kuyruk?f=bekleyen" className="block rounded-lg bg-surface p-2 hover:bg-cyan-50">
                      <span className="font-medium">{time(v.published_at ?? v.publish_at!)}</span> · {CONTENT_TYPE_TR[v.content_type]}
                      <div className="mt-1"><StatusBadge status={v.status} /></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
