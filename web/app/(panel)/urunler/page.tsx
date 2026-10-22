import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { Badge, Card, Field, Input, Notice, PageHeader } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { integrationStatus } from '@/lib/env';
import { fmtDateTime } from '@/lib/format';
import { vercelInfo } from '@/lib/vercel';
import { addProduct, setProductStatus, syncProduct, updateProduct } from './actions';

const STATUS_TR = { draft: ['Taslak', 'gray'], active: ['Aktif', 'green'], paused: ['Duraklatıldı', 'amber'] } as const;

export default async function ProductsPage() {
  const { db } = await requireAdminPage();
  const { data: products } = await db.from('products').select('*, product_briefs(id, version, status, approved_at)').order('created_at');
  const env = integrationStatus();
  const vercel = await Promise.all((products ?? []).map((p) => vercelInfo(p.vercel_project)));

  return (
    <>
      <PageHeader title="Ürünler" description="Ürün bilgileri, brief durumu ve salt okunur GitHub/Vercel incelemesi. Brief onaylanmadan o ürün için içerik üretilmez." />
      <div className="mb-4 space-y-2">
        <Notice>MVP: yalnızca Callypso Engage aktif. Inboxly ve GeoAdra MVP tamamlanıp onayınız alındıktan sonra eklenecek (veritabanı ikinci ürünün aktif edilmesini engeller).</Notice>
        {!env.vercel && <Notice tone="warn">Vercel bilgisi için VERCEL_TOKEN tanımlı değil (isteğe bağlı).</Notice>}
      </div>

      <div className="space-y-5">
        {(products ?? []).map((p, i) => {
          const briefs = (p.product_briefs ?? []) as { id: string; version: number; status: string; approved_at: string | null }[];
          const approved = briefs.find((b) => b.status === 'approved');
          const drafts = briefs.filter((b) => b.status === 'draft').length;
          const v = vercel[i];
          const [label, tone] = STATUS_TR[p.status as keyof typeof STATUS_TR] ?? ['?', 'gray'];
          return (
            <Card key={p.id} title={p.name} aside={<Badge tone={tone}>{label}</Badge>}>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted">Canlı site:</span> {p.site_url ?? '—'}</p>
                  <p><span className="text-muted">GitHub:</span> {p.github_repo ?? '—'}</p>
                  <p><span className="text-muted">Vercel projesi:</span> {p.vercel_project ?? '—'}</p>
                  <p className="flex flex-wrap items-center gap-1"><span className="text-muted">Marka renkleri:</span>
                    {Object.entries((p.brand_colors ?? {}) as Record<string, string>).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1 text-xs"><span className="h-4 w-4 rounded border border-line" style={{ background: c }} />{k}</span>)}
                  </p>
                  <p><span className="text-muted">Brief:</span> {approved ? <>v{approved.version} onaylı ({fmtDateTime(approved.approved_at)})</> : <strong className="text-red-700">onaylı brief yok</strong>}{drafts > 0 && <> · <Badge tone="amber">{drafts} taslak onay bekliyor</Badge></>}</p>
                  <p><span className="text-muted">Son senkronizasyon:</span> {fmtDateTime(p.last_synced_at)}</p>
                  {v && ('error' in v ? <p className="text-red-700">Vercel: {v.error}</p> : (
                    <p><span className="text-muted">Vercel:</span> {v.domains.join(', ') || '—'} · son deployment {fmtDateTime(v.deployments[0]?.created)} ({v.deployments[0]?.state ?? '—'})</p>
                  ))}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/urunler/${p.slug}`} className="inline-flex items-center rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-2">Brief&apos;i görüntüle / onayla</Link>
                    <ActionForm action={syncProduct} label="Senkronize et" variant="secondary" hidden={{ id: p.id }} />
                    {p.status !== 'active'
                      ? <ActionForm action={setProductStatus} label="Aktifleştir" variant="secondary" hidden={{ id: p.id, status: 'active' }} />
                      : <ActionForm action={setProductStatus} label="Duraklat" variant="danger" hidden={{ id: p.id, status: 'paused' }} confirm="Ürün duraklatılsın mı? Yeni video planlanmaz." />}
                  </div>
                  <p className="text-xs text-muted">Senkronize et: README, package.json, son 30 commit, sayfa adları (GitHub, salt okunur; .env ve gizli dosyalar okunmaz), canlı sitenin herkese açık ana sayfası (robots.txt&apos;e uyarak) ve Vercel deployment&apos;ları okunur → brief taslağı.</p>
                </div>
                <details className="rounded-xl border border-line p-3">
                  <summary className="cursor-pointer text-sm font-medium">Ürün bilgilerini düzenle</summary>
                  <ActionForm action={updateProduct} label="Kaydet" variant="secondary" hidden={{ id: p.id }} className="mt-3">
                    <div className="space-y-3">
                      <Field label="Canlı site URL"><Input name="site_url" defaultValue={p.site_url ?? ''} /></Field>
                      <Field label="GitHub (sahip/repo)"><Input name="github_repo" defaultValue={p.github_repo ?? ''} /></Field>
                      <Field label="Vercel proje adı"><Input name="vercel_project" defaultValue={p.vercel_project ?? ''} /></Field>
                      <Field label="Marka renkleri" hint="ad=#RRGGBB, virgülle"><Input name="brand_colors" defaultValue={Object.entries((p.brand_colors ?? {}) as Record<string, string>).filter(([, c]) => c.startsWith('#')).map(([k, c]) => `${k}=${c}`).join(', ')} /></Field>
                      <Field label="Logo URL"><Input name="logo_url" defaultValue={p.logo_url ?? ''} /></Field>
                    </div>
                  </ActionForm>
                </details>
              </div>
            </Card>
          );
        })}

        <Card title="Ürün ekle (taslak)">
          <p className="mb-3 text-sm text-muted">Yeni ürün taslak olarak eklenir. Senkronize edip brief&apos;i onaylamadan ve MVP sonrası çok ürünlü mod açılmadan içerik üretilmez.</p>
          <ActionForm action={addProduct} label="Ekle" variant="secondary">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Kısa ad" hint="ör. inboxly"><Input name="slug" required /></Field>
              <Field label="Ad"><Input name="name" required /></Field>
              <Field label="Canlı site URL"><Input name="site_url" placeholder="https://" /></Field>
              <Field label="GitHub (sahip/repo)"><Input name="github_repo" /></Field>
              <Field label="Vercel proje adı"><Input name="vercel_project" /></Field>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
