import { Story } from "./story";

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface FeedResponse {
  stories: Story[];
  pagination: PaginationMeta;
}

export type FeedFilter = "all" | "blindspot" | "balanced";
