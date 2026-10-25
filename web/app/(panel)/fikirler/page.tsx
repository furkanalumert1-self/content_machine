import Link from 'next/link';
import { isUsable } from '@content-machine/engine/ideas/select.ts';
import type { Idea } from '@content-machine/engine/ideas/types.ts';
import { ActionForm } from '@/components/action-form';
import { Badge, Card, Empty, Field, Input, Notice, PageHeader, Select } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { CONTENT_TYPE_TR, fmtDateTime } from '@/lib/format';
import { allowedFunnels, type Phase } from '@content-machine/engine/topics/channel.ts';
import { addIdea, deleteIdea, runResearch } from './actions';

const SOURCE_TR: Record<string, string> = { topic_bank: 'Konu bankası (kaynaklı)', changelog: 'Changelog', audience: 'Hedef kitle (brief)', trend: 'Trend', performance: 'Performans', manual: 'Elle', deployment: 'Deployment' };

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = 'kullanilabilir' } = await searchParams;
  const { db } = await requireAdminPage();
  const [{ data: ideas }, { data: products }, { data: runs }] = await Promise.all([
    db.from('ideas').select('*').order('score', { ascending: false }).limit(300),
    db.from('products').select('id, name').eq('status', 'active'),
    db.from('research_runs').select('ran_at, trigger, added, notes').order('ran_at', { ascending: false }).limit(5),
  ]);
  const { data: settings } = await db.from('app_settings').select('content_phase').single();
  const funnels = allowedFunnels((settings?.content_phase ?? 1) as Phase);
  const now = new Date();
  const all = (ideas ?? []) as Idea[];
  // Bu fazda feed'e giremeyen huni katmanı (ör. Faz 1'de BOF ürün tanıtımı) kullanılabilir sayılmaz.
  const usable = all.filter((i) => isUsable(i, now) && funnels.includes(i.funnel ?? 'BOF'));
  const list = f === 'tumu' ? all : f === 'kullanilan' ? all.filter((i) => i.used) : usable;

  return (
    <>
      <PageHeader title="Fikir bankası" description="Sepet Röntgeni konu bankası: sütun (A–D), huni katmanı ve doğrulanmış kaynaklar. Kullanılan konu 60 gün tekrar edilmez."
        actions={<ActionForm action={runResearch} label="Fikir araştırması başlat" variant="secondary" />} />
      <div className="mb-4 space-y-2">
        {usable.length < 10 && <Notice tone="warn">Kullanılabilir konu {usable.length}. Yeni konular kaynakları doğrulanarak konu bankasına (config/topics) eklenir; kaynaksız konu videoya giremez.</Notice>}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[['kullanilabilir', `Kullanılabilir (${usable.length})`], ['kullanilan', 'Kullanılan'], ['tumu', `Tümü (${all.length})`]].map(([k, l]) => (
          <Link key={k} href={`/fikirler?f=${k}`} className={`rounded-full px-3 py-1 text-sm ${f === k ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{l}</Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {!list.length && <Empty title="Fikir yok.">Haftalık araştırma Pazartesi 07:23&apos;te çalışır; isterseniz şimdi başlatın veya elle ekleyin.</Empty>}
          {list.map((i) => (
            <Card key={i.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{i.score}</Badge><Badge>{CONTENT_TYPE_TR[i.content_type]}</Badge><Badge>{SOURCE_TR[i.source] ?? i.source}</Badge>
                    <Badge tone={funnels.includes(i.funnel ?? 'BOF') ? 'green' : 'gray'}>{i.funnel ?? 'BOF'}{funnels.includes(i.funnel ?? 'BOF') ? '' : ' · bu fazda kullanılmaz'}</Badge>
                    {i.is_exploration && <Badge tone="amber">Keşif</Badge>}
                    {i.used && <Badge tone="gray">Kullanıldı {fmtDateTime(i.last_used_at)}</Badge>}
                  </div>
                  <p className="font-medium">{i.hook}</p>
                  <p className="text-sm">{i.idea}</p>
                  {i.topic ? (
                    <details className="mt-1 text-xs text-muted">
                      <summary className="cursor-pointer">Olgu ve kaynaklar</summary>
                      <p className="mt-1">{i.topic.fact}</p>
                      <ul className="ml-4 list-disc">{i.topic.facts.map((x, k) => <li key={k}>{x.text} — <a className="underline" href={x.source_url} target="_blank" rel="noreferrer">{x.source_label}</a></li>)}</ul>
                    </details>
                  ) : <p className="mt-1 text-xs text-muted">Neden: {i.why}</p>}
                </div>
                <ActionForm action={deleteIdea} label="Sil" variant="danger" hidden={{ id: i.id }} confirm="Fikir silinsin mi?" />
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-5">
          <Card title="Fikir ekle">
            {!products?.length ? <p className="text-sm text-muted">Aktif ürün yok.</p> : (
              <ActionForm action={addIdea} label="Ekle" variant="secondary">
                <div className="space-y-3">
                  <Field label="Ürün"><Select name="product_id">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
                  <Field label="Kanca (en fazla 8 kelime)"><Input name="hook" required maxLength={90} /></Field>
                  <Field label="Fikir"><Input name="idea" required maxLength={400} /></Field>
                  <Field label="İçerik türü"><Select name="content_type">{Object.entries(CONTENT_TYPE_TR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                  <Field label="Neden (isteğe bağlı)"><Input name="why" maxLength={300} /></Field>
                </div>
              </ActionForm>
            )}
          </Card>
          <Card title="Son araştırmalar">
            {!runs?.length ? <p className="text-sm text-muted">Henüz yok.</p> : (
              <ul className="space-y-3 text-xs">
                {runs.map((r) => (
                  <li key={r.ran_at}><p className="font-medium">{fmtDateTime(r.ran_at)} · {r.trigger} · +{r.added}</p>
                    <ul className="ml-4 list-disc text-muted">{(r.notes ?? []).map((n: string, k: number) => <li key={k}>{n}</li>)}</ul></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
