// Hikâye formatı (Sepet Röntgeni): seslendirme + her cümleye eşlik eden çizim (beat) + kelime kelime altyazı.
// Anlatı yapısı: kanca → hikâye/olgu → "Hadi röntgenini çekelim." → mekanizma → "her yerde var" → senin mağazan için → kapanış.

export type Mode = 'light' | 'xray';

export type Beat =
  | { type: 'title'; text: string; sub?: string }
  | { type: 'phone'; app: string; title: string; body: string; time?: string }
  | { type: 'counter'; value: number; label: string; icon?: 'flame' | 'star' | 'stamp' }
  | { type: 'stat'; value: string; label: string; bar?: number; note?: string }
  | { type: 'compare'; left: { label: string; value: string; bar: number }; right: { label: string; value: string; bar: number }; caption?: string }
  | { type: 'stamps'; total: number; filled: number; label: string; highlight?: number }
  | { type: 'scale'; heavy: string; light: string; caption?: string }
  | { type: 'chips'; items: string[]; title?: string }
  | { type: 'rule'; strike?: string; text: string }
  | { type: 'xray'; text: string }
  | { type: 'outro'; caseNo: number; cta: string };

export interface StorySegment {
  /** Seslendirilen cümle(ler). */
  say: string;
  show: Beat;
  mode?: Mode;
}

export interface WordTiming { w: string; start: number; end: number }

export interface StoryScene {
  id: string;
  start: number;
  duration: number;
  frames: number;
  say: string;
  show: Beat;
  mode: Mode;
}

export interface CaptionChunk { start: number; end: number; words: WordTiming[] }

export interface StoryScript {
  version: 2;
  format: 'story';
  product: string;
  channel: string;
  content_type: import('../ideas/types.ts').ContentType;
  case_no: number;
  case_label: string;
  hook: string;
  /** Planlanan anlatı (seslendirme render sırasında yapılır; o zamana kadar scenes/captions boştur). */
  segments: StorySegment[];
  scenes: StoryScene[];
  captions: CaptionChunk[];
  duration_sec: number;
  /** data:audio/mp4;base64,... — render sırasında kullanılır, veritabanına yazılmaz. */
  audio_src?: string;
  voice: { provider: 'elevenlabs'; voice_id: string; model: string; lufs: number | null };
  cta: string;
  cta_url: string;
  sample_data: false;
  review_notes: string[];
  sources: { label: string; url: string }[];
  funnel?: 'TOF' | 'MOF' | 'BOF';
  /** Reels kapağı tanımı (konu bankasından) ve üretilen kapağın depolama yolu. */
  cover?: import('../../remotion/Cover.tsx').CoverSpec;
  cover_path?: string;
}
