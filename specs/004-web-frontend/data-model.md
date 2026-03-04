# Data Model: Web Frontend

**Feature**: 004-web-frontend | **Date**: 2026-03-04

The web frontend consumes the existing backend API. These TypeScript types mirror the backend response schemas. No new database tables or backend models are needed.

## Types (consumed from API)

### Feed

```typescript
interface FeedStory {
  id: number;
  headline: string;
  summary: string;
  published_at: string;        // ISO 8601
  left_count: number;
  center_count: number;
  right_count: number;
  is_blindspot: boolean;
  blindspot_perspective: string | null;  // "left" | "center" | "right" | null
  total_coverage: number;
  image_url: string | null;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface FeedResponse {
  stories: FeedStory[];
  pagination: Pagination;
}

type FeedFilter = "all" | "blindspot" | "balanced";
```

### Story Detail

```typescript
interface Source {
  id: number;
  name: string;
  domain: string;
  bias_rating: "left" | "center" | "right";
  confidence: number;
}

interface Article {
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

interface StoryDetail {
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
```

### Chat

```typescript
type Perspective = "left" | "center" | "right";

interface PerspectiveAvailability {
  available: boolean;
  source_count: number;
}

interface PerspectiveAvailabilityResponse {
  perspectives: Record<Perspective, PerspectiveAvailability>;
}

interface ChatRequest {
  message: string;             // 1–2000 chars
  perspective: Perspective;
  conversation_id?: number;    // null to auto-create
}

interface Citation {
  index: number;
  source_name: string;
  article_title: string;
  article_url: string;
  bias_label: string;
  quoted_text: string;         // up to 200 chars
}

// SSE event types from POST /api/v1/chat/{story_id}/stream
type ChatSSEEvent =
  | { type: "conversation_start"; conversation_id: number }
  | { type: "context_summarized" }
  | { type: "token"; text: string }
  | { type: "citation"; citations: Citation[] }
  | { type: "done"; message_id: number }
  | { type: "ended"; reason: string; message: string }
  | { type: "error"; code: string; message: string };

interface ConversationSummary {
  id: number;
  story_id: number;
  perspective: Perspective;
  message_count: number;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  last_message_preview: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

interface Conversation {
  id: number;
  story_id: number;
  perspective: Perspective;
  is_ended: boolean;
  created_at: string;
  updated_at: string;
  messages: Message[];
}
```

### Debate

```typescript
type DebateStatus = "active" | "paused" | "completed";
type DebateRole = "persona_left" | "persona_center" | "persona_right" | "moderator";

interface DebateCreate {
  personas: Perspective[];     // 2–3 unique values
}

interface DebateSummary {
  id: number;
  story_id: number;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  turn_count: number;
  created_at: string;
  updated_at: string;
  last_turn_preview: string;
}

interface DebateTurn {
  id: number;
  turn_number: number;
  role: DebateRole;
  content: string;
  summary: string | null;
  citations: Citation[] | null;
  round_number: number;
  created_at: string;
}

interface DebateDetail {
  id: number;
  story_id: number;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  created_at: string;
  updated_at: string;
  turns: DebateTurn[];
}

// SSE event types from POST /api/v1/debate/{debate_id}/round
type DebateSSEEvent =
  | { type: "round_start"; round_number: number }
  | { type: "turn_start"; role: DebateRole; turn_number: number }
  | { type: "token"; text: string }
  | { type: "citation"; citations: Citation[] }
  | { type: "turn_summary"; turn_id: string; summary: string }
  | { type: "turn_complete"; turn_id: string; role: DebateRole }
  | { type: "round_complete"; round_number: number; debate_id: string }
  | { type: "ended"; reason: string; message: string }
  | { type: "error"; code: string; message: string };

interface InterjectionCreate {
  message: string;             // 1–2000 chars
  directed_at?: Perspective;
}

interface InterjectionResponse {
  turn_id: number;
  turn_number: number;
  role: "moderator";
  content: string;
  directed_at: Perspective | null;
}
```

## Relationships

```
FeedStory (list) ──click──▶ StoryDetail (1)
StoryDetail.articles[] ──grouped by──▶ source.bias_rating
StoryDetail ──"Explore Perspectives"──▶ Chat (by story_id + perspective)
StoryDetail ──"Start Debate"──▶ Debate (by story_id + personas[])
Chat conversations ──listed in──▶ Chat History (via GET /chat/{story_id}/conversations)
Debates ──listed in──▶ Debate History (via GET /debate/{story_id}/debates)
```

## State Transitions

### Chat Conversation
```
[new] ──send message──▶ [active] ──abuse threshold──▶ [ended]
                                  ──user leaves──▶ [persisted, resumable]
```

### Debate
```
[new] ──start──▶ active ──next round──▶ active (round N+1)
                        ──pause──▶ paused ──resume round──▶ active
                        ──complete──▶ completed
                        ──abuse──▶ ended
```
