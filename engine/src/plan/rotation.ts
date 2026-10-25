import { CONTENT_TYPES, type ContentType } from '../ideas/types.ts';
import { PILLAR_TYPE, type Pillar } from '../topics/types.ts';

export interface RecentVideo {
  product_id: string;
  content_type: ContentType;
  style: string;
  created_at: string;
  /** Senaryodaki anlamlı cümleler (tekrar kontrolü için). */
  sentences?: string[];
}

/**
 * MVP (çok ürün kapalı): tek aktif ürün her gün seçilir.
 * Çok ürünlü aşama: dünkü ürün tekrar seçilmez; en uzun süredir kullanılmayan aktif ürün seçilir.
 * @param recent en yeniden eskiye
 */
export function chooseProduct(activeIds: string[], recent: RecentVideo[], multiProduct: boolean): { id: string | null; reason: string } {
  if (!activeIds.length) return { id: null, reason: 'Aktif ürün yok (onaylı brief gerekli).' };
  if (!multiProduct) return { id: activeIds[0], reason: 'MVP: tek aktif ürün.' };
  const yesterday = recent[0]?.product_id;
  const candidates = activeIds.length > 1 ? activeIds.filter((id) => id !== yesterday) : activeIds;
  const lastSeen = (id: string) => { const i = recent.findIndex((v) => v.product_id === id); return i < 0 ? Infinity : i; };
  const id = [...candidates].sort((a, b) => lastSeen(b) - lastSeen(a) || a.localeCompare(b))[0];
  return { id, reason: activeIds.length > 1 ? 'Dönüşüm: dünkü ürün hariç en uzun süredir kullanılmayan ürün.' : 'Tek aktif ürün.' };
}

/** İçerik türlerini döndürür: son 14 günde en uzun süredir kullanılmayan tür; eşitlikte sabit sıra. */
export function chooseContentType(recent: RecentVideo[]): { type: ContentType; reason: string } {
  const lastSeen = (t: ContentType) => { const i = recent.findIndex((v) => v.content_type === t); return i < 0 ? Infinity : i; };
  const type = [...CONTENT_TYPES].sort((a, b) => lastSeen(b) - lastSeen(a) || CONTENT_TYPES.indexOf(a) - CONTENT_TYPES.indexOf(b))[0];
  const seen = lastSeen(type);
  return { type, reason: seen === Infinity ? `"${type}" son 14 günde hiç kullanılmadı.` : `"${type}" en uzun süredir kullanılmayan tür (${seen + 1} video önce).` };
}

/** Aktif stiller arasında en uzun süredir kullanılmayanı seçer. MVP'de tek stil. */
export function chooseStyle(activeStyles: string[], recent: RecentVideo[]): { style: string; reason: string } {
  if (activeStyles.length === 1) return { style: activeStyles[0], reason: 'MVP: tek stil.' };
  const lastSeen = (s: string) => { const i = recent.findIndex((v) => v.style === s); return i < 0 ? Infinity : i; };
  const style = [...activeStyles].sort((a, b) => lastSeen(b) - lastSeen(a) || a.localeCompare(b))[0];
  return { style, reason: 'En uzun süredir kullanılmayan stil.' };
}

export function summarizeRecent(recent: RecentVideo[]): string {
  if (!recent.length) return 'Son 14 günde video yok.';
  const count = <K extends keyof RecentVideo>(k: K) => {
    const m = new Map<string, number>();
    for (const v of recent) m.set(String(v[k]), (m.get(String(v[k])) ?? 0) + 1);
    return [...m.entries()].map(([key, n]) => `${key}×${n}`).join(', ');
  };
  return `Son 14 gün: ${recent.length} video; türler: ${count('content_type')}; stiller: ${count('style')}.`;
}

/**
 * Sepet Röntgeni sütun karması: son videolarda hedef orana en çok gerisinde kalan sütun seçilir
 * (eşitlikte hedefi büyük olan). Yalnızca sütun türündeki videolar sayılır.
 */
export function choosePillar(recent: RecentVideo[], targets: Record<Pillar, number>, window = 20): { type: ContentType; pillar: Pillar; reason: string } {
  const pillars = Object.keys(targets) as Pillar[];
  const counts = Object.fromEntries(pillars.map((p) => [p, 0])) as Record<Pillar, number>;
  const seen = recent.filter((v) => pillars.some((p) => PILLAR_TYPE[p] === v.content_type)).slice(0, window);
  for (const v of seen) counts[pillars.find((p) => PILLAR_TYPE[p] === v.content_type)!]++;
  const n = seen.length + 1;
  const deficit = (p: Pillar) => targets[p] * n - counts[p];
  const pillar = [...pillars].sort((a, b) => deficit(b) - deficit(a) || targets[b] - targets[a])[0];
  const pct = (x: number) => `%${Math.round(x * 100)}`;
  return {
    pillar, type: PILLAR_TYPE[pillar],
    reason: `Sütun ${pillar} (${PILLAR_TYPE[pillar]}): son ${seen.length} videoda ${counts[pillar]} kez, hedef ${pct(targets[pillar])}; en çok geride kalan sütun.`,
  };
}
