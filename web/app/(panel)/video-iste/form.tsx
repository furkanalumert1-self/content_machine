'use client';
import { useActionState } from 'react';
import { Button, Card, Field, Notice, Select, Textarea } from '@/components/ui';
import { CONTENT_TYPE_TR } from '@/lib/format';
import { requestVideo } from './actions';

export function RequestForm({ products, styles }: { products: { id: string; name: string }[]; styles: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(requestVideo, undefined);
  return (
    <Card>
      <form action={action} className="grid gap-4 md:grid-cols-2">
        <Field label="Ürün"><Select name="product_id">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Stil"><Select name="style">{styles.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</Select></Field>
        <div className="md:col-span-2">
          <Field label="Talimat (isteğe bağlı)" hint="İlk cümle kanca olur (en fazla 8 kelime). Örn: Sepeti terk eden müşteri seni unutmadı. Sadece bir hatırlatma bekliyor. — Kaynaksız rakam, web adresi, rakip ve ürün adı yazmayın.">
            <Textarea name="instruction" rows={4} maxLength={600} className="font-sans" placeholder="Boş bırakırsanız sistem fikir seçer." />
          </Field>
        </div>
        <Field label="İçerik türü (yalnızca talimat varsa)">
          <Select name="content_type" defaultValue=""><option value="">Otomatik</option>{Object.entries(CONTENT_TYPE_TR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
        </Field>
        <Field label="Süre"><Select name="duration" defaultValue=""><option value="">Otomatik (~50 sn)</option><option value="45">45 sn</option><option value="50">50 sn</option><option value="55">55 sn</option></Select></Field>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" name="mode" value="now" disabled={pending}>{pending ? 'Hazırlanıyor…' : 'Hemen üret'}</Button>
          <Button type="submit" name="mode" value="queue" variant="secondary" disabled={pending}>Kuyruğa ekle</Button>
        </div>
      </form>
      {state && <div className="mt-4 whitespace-pre-wrap"><Notice tone={state.ok ? 'ok' : 'error'}>{state.message}</Notice></div>}
    </Card>
  );
}
