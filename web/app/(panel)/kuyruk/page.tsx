import Link from 'next/link';
import { ActionForm } from '@/components/action-form';
import { Badge, Card, Empty, Field, Input, Notice, PageHeader, StatusBadge, Textarea } from '@/components/ui';
import { requireAdminPage } from '@/lib/dal';
import { CONTENT_TYPE_TR, fmtDateTime, toLocalInput } from '@/lib/format';
import { previewUrls } from '@/lib/media';
import { approve, changeTime, editCaption, regenerate, reject, renderNow } from './actions';

type QcCheck = { name: string; ok: boolean; detail: string };
type Row = {
  id: string; status: string; content_type: string; style: string; duration_sec: number; caption: string; hashtags: string[];
  publish_at: string | null; publish_at_reason: string | null; plan_reason: string | null; storage_path: string | null;
  error: string | null; qc: { checks?: QcCheck[] } | null; created_at: string; origin: string; request_instruction: string | null;
  script: { review_notes?: string[]; hook?: string; channel?: string; cover_path?: string }; ig_permalink: string | null; published_at: string | null;
};

const FILTERS = {
  bekleyen: { label: 'İşlem bekleyen', statuses: ['planned', 'rendering', 'render_failed', 'ready', 'approved', 'publishing', 'publish_failed'] },
  yayinlanan: { label: 'Yayınlanan', statuses: ['published'] },
  reddedilen: { label: 'Reddedilen', statuses: ['rejected'] },
} as const;

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = FILTERS[(f as keyof typeof FILTERS) ?? 'bekleyen'] ?? FILTERS.bekleyen;
  const { db } = await requireAdminPage();
  const { data } = await db.from('videos')
    .select('id, status, content_type, style, duration_sec, caption, hashtags, publish_at, publish_at_reason, plan_reason, storage_path, error, qc, created_at, origin, request_instruction, script, ig_permalink, published_at')
    .in('status', [...filter.statuses]).order('publish_at', { ascending: filter === FILTERS.bekleyen, nullsFirst: false }).limit(40);
  const rows = (data ?? []) as Row[];
  const urls = await previewUrls(rows.flatMap((r) => [r.storage_path, r.script?.cover_path]).filter((p): p is string => !!p));
  const waiting = rows.filter((r) => r.status === 'ready').length;

  return (
    <>
      <PageHeader title="Kuyruk ve onay"
        description="Hazır videoları izleyin, onaylayın veya reddedin. Onaylamadığınız video yayınlanmaz. İçeriği değiştirirseniz önceki onay geçersiz olur."
        actions={<ActionForm action={renderNow} label="Bekleyenleri şimdi üret" variant="secondary" />} />

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(FILTERS).map(([key, v]) => (
          <Link key={key} href={`/kuyruk?f=${key}`} className={`rounded-full px-3 py-1 text-sm ${filter === v ? 'bg-navy text-white' : 'bg-white text-muted ring-1 ring-line'}`}>{v.label}</Link>
        ))}
      </div>

      {filter === FILTERS.bekleyen && waiting > 0 && <div className="mb-4"><Notice tone="warn">{waiting} video onayınızı bekliyor.</Notice></div>}
      <div className="mb-4"><Notice>Yayın kontrolü Supabase zamanlayıcısıyla 13:07–16:07 ve 19:07–21:07 arasında 15 dakikada bir çalışır; Onay planlanan saatten sonra gelirse video sıradaki boş aralığa alınır.</Notice></div>

      {!rows.length && <Empty title="Bu listede video yok.">Yeni video sabah 08:41&apos;de otomatik planlanır. Hemen bir tane için <Link className="underline" href="/video-iste">Video iste</Link>.</Empty>}

      <div className="space-y-5">
        {rows.map((v) => {
          const url = v.storage_path ? urls[v.storage_path] : undefined;
          const failedChecks = (v.qc?.checks ?? []).filter((c) => !c.ok);
          const notes = v.script?.review_notes ?? [];
          const editable = !['publishing', 'published'].includes(v.status);
          return (
            <Card key={v.id}>
              <div className="grid gap-5 md:grid-cols-[240px_1fr]">
                <div>
                  {url ? (
                    <video src={url} controls playsInline preload="metadata" className="aspect-[9/16] w-full rounded-xl bg-black" />
                  ) : (
                    <div className="flex aspect-[9/16] w-full items-center justify-center rounded-xl bg-navy p-4 text-center text-sm text-white/70">
                      {v.status === 'render_failed' ? 'Üretim başarısız' : 'Video henüz üretilmedi'}
                    </div>
                  )}
                  {v.script?.cover_path && urls[v.script.cover_path] && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-muted">Kapak (profil ızgarasında 3:4 kırpılır)</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urls[v.script.cover_path]} alt="Reels kapağı" className="aspect-[9/16] w-28 rounded-lg object-cover ring-1 ring-line" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={v.status} />
                    <Badge>{CONTENT_TYPE_TR[v.content_type] ?? v.content_type}</Badge>
                    <Badge>{v.duration_sec} sn</Badge>
                    {v.origin === 'manual' && <Badge tone="blue">Elle istendi</Badge>}
                    {v.ig_permalink && <a className="text-sm text-navy-2 underline" href={v.ig_permalink} target="_blank" rel="noreferrer">Instagram&apos;da aç</a>}
                  </div>

                  <div className="text-sm">
                    <p><span className="text-muted">Planlanan yayın:</span> <strong>{fmtDateTime(v.publish_at)}</strong>{v.published_at && <> · <span className="text-muted">Yayınlandı:</span> {fmtDateTime(v.published_at)}</>}</p>
                    {v.publish_at_reason && <p className="mt-1 text-muted">Saat gerekçesi: {v.publish_at_reason}</p>}
                  </div>

                  {v.error && <Notice tone="error">{v.error}</Notice>}
                  {failedChecks.length > 0 && <Notice tone="error">Kalite kontrolü: {failedChecks.map((c) => `${c.name} (${c.detail})`).join('; ')}</Notice>}
                  {notes.length > 0 && <Notice tone="warn">{notes.join(' ')}</Notice>}

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted">Caption (Instagram açıklaması)</p>
                    <p className="whitespace-pre-wrap rounded-xl bg-surface p-3 text-sm">{v.caption}</p>
                    <p className="mt-2 text-sm text-navy-2">{v.hashtags.join(' ')}</p>
                  </div>

                  {v.plan_reason && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted">Neden bu video? (seçim gerekçesi)</summary>
                      <p className="mt-2 whitespace-pre-wrap text-muted">{v.plan_reason}</p>
                    </details>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {v.status === 'ready' && <ActionForm action={approve} label="✅ Onayla" variant="success" hidden={{ id: v.id }} />}
                    {['ready', 'approved', 'planned', 'render_failed', 'publish_failed'].includes(v.status) &&
                      <ActionForm action={reject} label="Reddet" variant="danger" hidden={{ id: v.id }} confirm="Bu video reddedilsin mi? Reddedilen video yayınlanmaz." />}
                    {['ready', 'approved', 'rejected', 'render_failed', 'publish_failed'].includes(v.status) &&
                      <ActionForm action={regenerate} label="Yeniden üret" variant="secondary" hidden={{ id: v.id }} confirm="Video yeniden üretilsin mi? Yeni video için tekrar onay gerekir." />}
                  </div>

                  {editable && (
                    <details className="rounded-xl border border-line p-3">
                      <summary className="cursor-pointer text-sm font-medium">Düzenle / saati değiştir</summary>
                      <div className="mt-3 grid gap-4 lg:grid-cols-2">
                        <ActionForm action={editCaption} label="Kaydet" variant="secondary" hidden={{ id: v.id }}>
                          <div className="space-y-3">
                            <Field label="Caption" hint="Web adresi, rakip adı, % vaadi ve kişisel veri kabul edilmez.">
                              <Textarea name="caption" rows={7} defaultValue={v.caption} />
                            </Field>
                            <Field label={`Hashtag'ler (boşlukla, ${v.script?.channel ? '3–5' : '5–10'})`}><Input name="hashtags" defaultValue={v.hashtags.join(' ')} /></Field>
                          </div>
                        </ActionForm>
                        <ActionForm action={changeTime} label="Saati kaydet" variant="secondary" hidden={{ id: v.id }}>
                          <Field label="Yayın zamanı (İstanbul)" hint="Saat değişikliği onayı bozmaz.">
                            <Input type="datetime-local" name="publish_at" defaultValue={toLocalInput(v.publish_at)} />
                          </Field>
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
