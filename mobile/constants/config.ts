export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  feed: "/api/v1/feed",
  story: (id: number) => `/api/v1/story/${id}`,
  refresh: "/api/v1/refresh",
} as const;

export const CACHE_TTL = {
  feed: 5 * 60 * 1000, // 5 minutes
  story: 10 * 60 * 1000, // 10 minutes
} as const;

export const FEED_PAGE_SIZE = 20;
