/** Ürün tanıtım türleri (brief'ten; huni BOF) + Sepet Röntgeni sütunları (konu bankasından). mit_curutme ikisinde ortak. */
export type ProductContentType = 'problem_cozum' | 'ipucu' | 'mini_demo' | 'once_sonra' | 'mit_curutme';
export type PillarContentType = 'marka_rontgeni' | 'fiyat_psikolojisi' | 'magazana_kur' | 'mit_curutme';
export type ContentType = ProductContentType | PillarContentType;
export type IdeaSource = 'changelog' | 'audience' | 'trend' | 'performance' | 'manual' | 'deployment' | 'topic_bank';
export type Funnel = 'TOF' | 'MOF' | 'BOF';

export const CONTENT_TYPES: ProductContentType[] = ['problem_cozum', 'ipucu', 'mini_demo', 'once_sonra', 'mit_curutme'];
export const PILLAR_TYPES: PillarContentType[] = ['marka_rontgeni', 'fiyat_psikolojisi', 'magazana_kur', 'mit_curutme'];
export const ALL_CONTENT_TYPES: ContentType[] = [...new Set<ContentType>([...PILLAR_TYPES, ...CONTENT_TYPES])];

export interface IdeaDraft {
  idea: string;
  hook: string;
  content_type: ContentType;
  source: IdeaSource;
  source_ref: string | null;
  score: number;
  is_exploration: boolean;
  why: string;
  funnel?: Funnel;
}

export interface Idea extends IdeaDraft {
  id: string;
  product_id: string;
  used: boolean;
  last_used_at: string | null;
  /** Veritabanında her zaman dolu; bellek içi eski fikirlerde yoksa BOF sayılır. */
  funnel?: Funnel;
  /** Konu bankasından gelen fikirlerde senaryonun doğrulanmış içeriği (kaynaklarıyla). */
  topic?: import('../topics/types.ts').Topic | null;
}

export interface Commit { sha: string; date: string; message: string }

export interface VideoPerformance {
  video_id: string;
  idea_id: string | null;
  content_type: ContentType;
  style: string;
  publish_hour: number;
  views: number | null;
  likes: number | null;
  saved: number | null;
}
