import type { Funnel, PillarContentType } from '../ideas/types.ts';

/** İçerik sütunları (Sepet Röntgeni): A marka röntgeni/retention, B fiyat ve sepet psikolojisi, C mağazana kur, D mit kırma. */
export type Pillar = 'A' | 'B' | 'C' | 'D';

export const PILLAR_TYPE: Record<Pillar, PillarContentType> = { A: 'marka_rontgeni', B: 'fiyat_psikolojisi', C: 'magazana_kur', D: 'mit_curutme' };
/** Sütun C uygulama rehberidir (MOF); diğerleri farkındalık (TOF). */
export const PILLAR_FUNNEL: Record<Pillar, Funnel> = { A: 'TOF', B: 'TOF', C: 'MOF', D: 'TOF' };

/** Senaryoya giren her rakam/olgu en az bir kaynağa dayanır. */
export interface Fact {
  text: string;
  source_label: string;
  source_url: string;
  source_type: 'academic' | 'official' | 'press';
  /** Kaynağın açılıp doğrulandığı tarih (YYYY-AA-GG). */
  checked_at: string;
  note?: string;
}

export interface Topic {
  key: string;
  pillar: Pillar;
  funnel: Funnel;
  brand: string;
  mechanism: string;
  /** Konunun ileride bağlanacağı Callypso özelliği (Faz 1'de videoda geçmez). */
  callypso_feature: string;
  status: 'dogrulandi' | 'beklemede';
  /** 3 kanca adayı; en iyisi puanla seçilir. */
  hooks: string[];
  cover: { line1: string; line2: string; object: string };
  /** OLGU: marka + tek rakam, tek cümle. */
  fact: string;
  /** Ekranda büyük ve tek başına gösterilecek rakam (ör. "%34"). */
  big_number?: string;
  mechanism_lines: string[];
  /** "Senin mağazan için": tek, uygulanabilir aksiyon (1–2 cümle). */
  action: string[];
  /** Açıklama metnindeki tek cümlelik içgörü. */
  insight: string;
  /** Açıklama metnindeki yorum sorusu. */
  question: string;
  /** Konuya özel 2 hashtag (#marka #mekanizma). */
  tags: string[];
  facts: Fact[];
  score: number;
  /** Hikâye formatı (seslendirmeli): cümle cümle anlatı + her cümlenin çizimi. Yoksa konu henüz hikâyeye çevrilmemiştir. */
  story?: { label: string; segments: import('../story/types.ts').StorySegment[] };
}

export interface TopicBank {
  version: 1;
  channel: string;
  product: string;
  topics: Topic[];
}
