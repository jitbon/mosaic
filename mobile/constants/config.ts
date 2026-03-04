export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  feed: "/api/v1/feed",
  story: (id: number) => `/api/v1/story/${id}`,
  refresh: "/api/v1/refresh",
  chatStream: (storyId: string) => `/api/v1/chat/${storyId}/stream`,
  chatPerspectives: (storyId: string) => `/api/v1/chat/${storyId}/perspectives`,
  chatConversations: (storyId: string) =>
    `/api/v1/chat/${storyId}/conversations`,
  chatConversation: (conversationId: string) =>
    `/api/v1/chat/conversations/${conversationId}`,
  debateStart: (storyId: string) => `/api/v1/debate/${storyId}/start`,
  debateRound: (debateId: string) => `/api/v1/debate/${debateId}/round`,
  debateInterject: (debateId: string) => `/api/v1/debate/${debateId}/interject`,
  debateList: (storyId: string) => `/api/v1/debate/${storyId}/debates`,
  debateDetail: (debateId: string) => `/api/v1/debate/${debateId}`,
  debateStatus: (debateId: string) => `/api/v1/debate/${debateId}/status`,
} as const;

export const CACHE_TTL = {
  feed: 5 * 60 * 1000, // 5 minutes
  story: 10 * 60 * 1000, // 10 minutes
  chat: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

export const CHAT_CONFIG = {
  maxMessageLength: 2000,
  abuseRedirectLimit: 3,
  retentionDays: 30,
} as const;

export const DEBATE_CONFIG = {
  maxMessageLength: 2000,
  abuseRedirectLimit: 3,
  retentionDays: 30,
  maxPersonas: 3,
  minPersonas: 2,
} as const;

export const FEED_PAGE_SIZE = 20;
