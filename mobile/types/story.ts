export interface Source {
  id: number;
  name: string;
  domain: string;
  bias_rating: string;
  confidence: number;
}

export interface Article {
  id: number;
  story_id: number;
  source_id: number;
  title: string;
  url: string;
  published_at: string | null;
  snippet: string | null;
  image_url: string | null;
  source: Source | null;
}

export interface Story {
  id: number;
  headline: string;
  summary: string | null;
  published_at: string;
  left_count: number;
  center_count: number;
  right_count: number;
  is_blindspot: boolean;
  blindspot_perspective: string | null;
  total_coverage: number;
  image_url: string | null;
}

export interface StoryDetail extends Story {
  articles: Article[];
}
