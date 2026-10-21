export type ContentType = 'problem_cozum' | 'ipucu' | 'mini_demo' | 'once_sonra' | 'mit_curutme';
export type IdeaSource = 'changelog' | 'audience' | 'trend' | 'performance' | 'manual' | 'deployment';

export const CONTENT_TYPES: ContentType[] = ['problem_cozum', 'ipucu', 'mini_demo', 'once_sonra', 'mit_curutme'];

export interface IdeaDraft {
  idea: string;
  hook: string;
  content_type: ContentType;
  source: IdeaSource;
  source_ref: string | null;
  score: number;
  is_exploration: boolean;
  why: string;
}

export interface Idea extends IdeaDraft {
  id: string;
  product_id: string;
  used: boolean;
  last_used_at: string | null;
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
