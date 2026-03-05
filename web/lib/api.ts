import type { FeedFilter, FeedResponse } from "@/types/feed";
import type { StoryDetail } from "@/types/story";
import type {
  ChatRequest,
  Conversation,
  ConversationSummary,
  PerspectiveAvailabilityResponse,
} from "@/types/chat";
import type {
  DebateCreate,
  DebateDetail,
  DebateSummary,
  InterjectionCreate,
  InterjectionResponse,
} from "@/types/debate";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Feed
export function getFeed(filter: FeedFilter = "all", offset = 0, limit = 20) {
  return apiFetch<FeedResponse>(
    `/api/v1/feed?filter=${filter}&offset=${offset}&limit=${limit}`
  );
}

// Story
export function getStory(id: number) {
  return apiFetch<StoryDetail>(`/api/v1/story/${id}`);
}

// Chat perspectives
export function getPerspectives(storyId: number) {
  return apiFetch<PerspectiveAvailabilityResponse>(
    `/api/v1/chat/${storyId}/perspectives`
  );
}

// Conversations
export async function getConversations(storyId: number) {
  const res = await apiFetch<{ conversations: ConversationSummary[] }>(
    `/api/v1/chat/${storyId}/conversations`
  );
  return res.conversations;
}

export function getConversation(conversationId: number) {
  return apiFetch<Conversation>(`/api/v1/chat/conversations/${conversationId}`);
}

export function deleteConversation(conversationId: number) {
  return apiFetch<void>(`/api/v1/chat/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

// Debate
export function startDebate(storyId: number, body: DebateCreate) {
  return apiFetch<DebateDetail>(`/api/v1/debate/${storyId}/start`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getDebates(storyId: number) {
  const res = await apiFetch<{ debates: DebateSummary[] }>(
    `/api/v1/debate/${storyId}/debates`
  );
  return res.debates;
}

export function getDebate(debateId: number) {
  return apiFetch<DebateDetail>(`/api/v1/debate/${debateId}`);
}

export function updateDebateStatus(
  debateId: number,
  status: "paused" | "completed"
) {
  return apiFetch<DebateDetail>(`/api/v1/debate/${debateId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteDebate(debateId: number) {
  return apiFetch<void>(`/api/v1/debate/${debateId}`, { method: "DELETE" });
}

export function postInterjection(debateId: number, body: InterjectionCreate) {
  return apiFetch<InterjectionResponse>(
    `/api/v1/debate/${debateId}/interject`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

// SSE stream URLs (used by sse.ts)
export function chatStreamUrl(storyId: number) {
  return `${BASE}/api/v1/chat/${storyId}/stream`;
}

export function debateRoundUrl(debateId: number) {
  return `${BASE}/api/v1/debate/${debateId}/round`;
}

// Unused import kept for type-checking only
export type { ChatRequest };
