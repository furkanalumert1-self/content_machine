// Sepet Röntgeni kanalının sabit kuralları (docs/icerik-plani.md). Fazlar: 1 trafik, 2 lead, 3 dönüşüm.
import type { Funnel } from '../ideas/types.ts';
import type { Pillar } from './types.ts';

export const CHANNEL_NAME = 'Sepet Röntgeni';
export const CTA_KEYWORD = 'REHBER';
export const CTA_LINES = ['Bunun gibi 25 taktiği PDF yaptım.', `Yorumlara ${CTA_KEYWORD} yaz, DM'den atayım.`];
export const CAPTION_CTA = `Bunun gibi 25 taktiği PDF yaptım → yorumlara ${CTA_KEYWORD} yaz, DM'den göndereyim.`;
export const BASE_TAGS = ['#eticaret', '#müşterideneyimi', '#pazarlama'];

export const MIN_SEC = 45;
export const MAX_SEC = 58;
export const TARGET_SEC = 50;
export const MAX_HOOK_WORDS = 8;
export const MIN_TAGS = 3;
export const MAX_TAGS = 5;

export type Phase = 1 | 2 | 3;

/** BOF (ürün tanıtımı) feed'e Faz 3'e kadar girmez. */
export function allowedFunnels(phase: Phase): Funnel[] {
  return phase >= 3 ? ['TOF', 'MOF', 'BOF'] : ['TOF', 'MOF'];
}

/**
 * Sütun oranları. Faz 1'de MOF en fazla %10 olduğu için uygulama sütunu (C, MOF) %10'a çekilir,
 * aradaki pay marka röntgenine (A) verilir. TOF hiçbir fazda %50'nin altına düşmez.
 */
export function pillarTargets(phase: Phase): Record<Pillar, number> {
  return phase === 1 ? { A: 0.55, B: 0.25, C: 0.1, D: 0.1 } : { A: 0.5, B: 0.25, C: 0.15, D: 0.1 };
}

/** Faz 1'de ürün adı hiçbir yerde geçmez. */
export const productNameAllowed = (phase: Phase) => phase >= 2;

/** Kanalın sabit anlatıcı sesi (ElevenLabs hazır ses "Matilda"; kullanıcı 26.10'da kadın sesini seçti). */
export const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'XrExE9yKIg1WjnnlVkGX';
export const VOICE_SPEED = 1.1;
