import { activeStyles } from '@content-machine/engine/config/styles.ts';
import { RequestForm } from './form';
import { Empty, Notice, PageHeader } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';

export default async function RequestPage() {
  const { db } = await requireAdminPage();
  const { data: products } = await db.from('products').select('id, name, status').eq('status', 'active').order('name');
  return (
    <>
      <PageHeader title="Video iste" description="Talimat yazarsanız ilk cümle videonun ilk 2 saniyesindeki hook olur. Boş bırakırsanız sistem onaylı brief'ten fikir seçer. Her video yayından önce onayınıza sunulur." />
      {!products?.length ? (
        <Empty title="Aktif ürün yok.">Önce Ürünler sayfasında brief&apos;i onaylayıp ürünü aktifleştirin.</Empty>
      ) : (
        <>
          <div className="mb-4"><Notice>Yeni ürünler (Inboxly, GeoAdra) MVP tamamlanıp onayınız alındıktan sonra eklenecek.</Notice></div>
          <RequestForm products={products.map((p) => ({ id: p.id, name: p.name }))} styles={activeStyles().map((s) => ({ slug: s.slug, name: s.name }))} />
        </>
      )}
    </>
  );
}
