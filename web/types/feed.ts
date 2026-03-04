export interface FeedStory {
  id: number;
  headline: string;
  summary: string;
  published_at: string;
  left_count: number;
  center_count: number;
  right_count: number;
  is_blindspot: boolean;
  blindspot_perspective: string | null;
  total_coverage: number;
  image_url: string | null;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface FeedResponse {
  stories: FeedStory[];
  pagination: Pagination;
}

export type FeedFilter = "all" | "blindspot" | "balanced";
