// Türkçe tarih/saat ve durum etiketleri (İstanbul saati).
const TZ = 'Europe/Istanbul';

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '—';
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, dateStyle: 'medium' }).format(new Date(iso)) : '—';
export const fmtNum = (n: number | null | undefined) => (n == null ? '—' : new Intl.NumberFormat('tr-TR').format(n));

/** İstanbul yerel "YYYY-MM-DDTHH:mm" (datetime-local girişi için). */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export const STATUS: Record<string, { label: string; tone: 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'cyan' }> = {
  planned: { label: 'Planlandı', tone: 'gray' },
  rendering: { label: 'Üretiliyor', tone: 'blue' },
  render_failed: { label: 'Üretim başarısız', tone: 'red' },
  ready: { label: 'Onay bekliyor', tone: 'amber' },
  approved: { label: 'Onaylandı', tone: 'green' },
  rejected: { label: 'Reddedildi', tone: 'red' },
  publishing: { label: 'Yayınlanıyor', tone: 'blue' },
  published: { label: 'Yayınlandı', tone: 'cyan' },
  publish_failed: { label: 'Yayın başarısız', tone: 'red' },
};

export const CONTENT_TYPE_TR: Record<string, string> = {
  problem_cozum: 'Problem → çözüm', ipucu: 'İpucu', mini_demo: 'Mini demo', once_sonra: 'Önce / sonra', mit_curutme: 'Mit çürütme',
};
