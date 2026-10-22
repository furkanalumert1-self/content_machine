import { notFound } from 'next/navigation';
import { ActionForm } from '@/components/action-form';
import { Badge, Card, Field, Notice, PageHeader, Textarea } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { fmtDateTime } from '@/lib/format';
import { approveBrief, saveBrief, syncProduct } from '../actions';

const TONE = { draft: 'amber', approved: 'green', superseded: 'gray' } as const;
const LABEL = { draft: 'Taslak', approved: 'Onaylı', superseded: 'Eski' } as const;

export default async function BriefPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> }) {
  const { slug } = await params;
  const { v } = await searchParams;
  const { db } = await requireAdminPage();
  const { data: p } = await db.from('products').select('id, name, slug').eq('slug', slug).maybeSingle();
  if (!p) notFound();
  const { data: briefs } = await db.from('product_briefs').select('id, version, status, content_md, approved_at, created_at').eq('product_id', p.id).order('version', { ascending: false });
  const list = briefs ?? [];
  const selected = list.find((b) => String(b.version) === v) ?? list.find((b) => b.status === 'draft') ?? list.find((b) => b.status === 'approved') ?? list[0];
  const body = selected?.content_md.replace(/^---\n[\s\S]*?\n---\n?/, '') ?? '';

  return (
    <>
      <PageHeader title={`${p.name} — Brief`} description="Hedef kitle, 5 acı noktası, 5 doğrulanmış özellik, ton, CTA ve yasak konular. Değişiklik yeni taslak sürüm açar; onaylanana kadar videolar önceki onaylı sürümle üretilir."
        actions={<ActionForm action={syncProduct} label="Senkronize et" variant="secondary" hidden={{ id: p.id }} />} />
      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <Card title="Sürümler">
          {!list.length && <p className="text-sm text-muted">Henüz brief yok. &quot;Senkronize et&quot; ile taslak çıkarın.</p>}
          <ul className="space-y-2 text-sm">
            {list.map((b) => (
              <li key={b.id}><a href={`?v=${b.version}`} className={`flex items-center justify-between rounded-lg px-2 py-1 ${selected?.id === b.id ? 'bg-surface font-medium' : ''}`}>
                <span>v{b.version}</span><Badge tone={TONE[b.status as keyof typeof TONE]}>{LABEL[b.status as keyof typeof LABEL]}</Badge></a></li>
            ))}
          </ul>
        </Card>
        {selected ? (
          <Card title={`v${selected.version} · ${LABEL[selected.status as keyof typeof LABEL]}`} aside={<span className="text-xs text-muted">{fmtDateTime(selected.approved_at ?? selected.created_at)}</span>}>
            {selected.status === 'draft' && (
              <div className="mb-4 space-y-3">
                <Notice tone="warn">Bu taslak onay bekliyor. Demo rakamlarını gerçek sonuç gibi yazmayın; gerekiyorsa &quot;örnek veri&quot; deyin.</Notice>
                <ActionForm action={approveBrief} label="Bu sürümü onayla" variant="success" hidden={{ id: selected.id }} confirm="Bu brief sürümü onaylansın mı? Sonraki videolar bu sürümle üretilir." />
              </div>
            )}
            <ActionForm action={saveBrief} label="Yeni taslak olarak kaydet" variant="secondary" hidden={{ product_id: p.id }}>
              <Field label="Brief (Markdown)" hint={'Biçim: 1. **Ad** — açıklama. Hook: "…" → Özellik N · 1. **Ad** — açıklama. İpucu: "…"'}>
                <Textarea name="content_md" rows={28} defaultValue={body} />
              </Field>
            </ActionForm>
          </Card>
        ) : <Card><p className="text-sm text-muted">Sürüm seçin.</p></Card>}
      </div>
    </>
  );
}
