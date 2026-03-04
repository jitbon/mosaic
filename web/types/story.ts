export interface Source {
  id: number;
  name: string;
  domain: string;
  bias_rating: "left" | "center" | "right";
  confidence: number;
}

export interface Article {
  id: number;
  story_id: number;
  source_id: number;
  title: string;
  url: string;
  published_at: string;
  snippet: string;
  image_url: string | null;
  source: Source;
}

export interface StoryDetail {
  id: number;
  headline: string;
  summary: string;
  published_at: string;
  left_count: number;
  center_count: number;
  right_count: number;
  is_blindspot: boolean;
  blindspot_perspective: string | null;
  articles: Article[];
}
