import { CONTENT_TYPES, type ContentType } from '../ideas/types.ts';

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
