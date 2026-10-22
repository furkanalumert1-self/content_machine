import Link from 'next/link';
import { isUsable } from '@content-machine/engine/ideas/select.ts';
import type { Idea } from '@content-machine/engine/ideas/types.ts';
import { ActionForm } from '@/components/action-form';
import { Badge, Card, Empty, Field, Input, Notice, PageHeader, Select } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { CONTENT_TYPE_TR, fmtDateTime } from '@/lib/format';
import { addIdea, deleteIdea, runResearch } from './actions';

const SOURCE_TR: Record<string, string> = { changelog: 'Changelog', audience: 'Hedef kitle (brief)', trend: 'Trend', performance: 'Performans', manual: 'Elle', deployment: 'Deployment' };

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f = 'kullanilabilir' } = await searchParams;
  const { db } = await requireAdminPage();
  const [{ data: ideas }, { data: products }, { data: runs }] = await Promise.all([
    db.from('ideas').select('*').order('score', { ascending: false }).limit(300),
    db.from('products').select('id, name').eq('status', 'active'),
    db.from('research_runs').select('ran_at, trigger, added, notes').order('ran_at', { ascending: false }).limit(5),
  ]);
  const now = new Date();
  const all = (ideas ?? []) as Idea[];
  const usable = all.filter((i) => isUsable(i, now));
  const list = f === 'tumu' ? all : f === 'kullanilan' ? all.filter((i) => i.used) : usable;

  return (
    <>
      <PageHeader title="Fikir bankası" description="Puan (0–100), kaynak ve 'neden bu fikir' notu. Kullanılan fikir 60 gün tekrar edilmez; 4 günde bir keşif fikri seçilir."
        actions={<ActionForm action={runResearch} label="Fikir araştırması başlat" variant="secondary" />} />
      <div className="mb-4 space-y-2">
        {usable.length < 10 && <Notice tone="warn">Kullanılabilir fikir {usable.length}. 10&apos;un altına düşünce günlük iş acil araştırma yapar; brief&apos;e mit/ipucu eklemek stoku artırır.</Notice>}
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
                    {i.is_exploration && <Badge tone="amber">Keşif</Badge>}
                    {i.used && <Badge tone="gray">Kullanıldı {fmtDateTime(i.last_used_at)}</Badge>}
                  </div>
                  <p className="font-medium">{i.hook}</p>
                  <p className="text-sm">{i.idea}</p>
                  <p className="mt-1 text-xs text-muted">Neden: {i.why}</p>
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
                  <Field label="Hook (en fazla 10 kelime)"><Input name="hook" required maxLength={90} /></Field>
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
