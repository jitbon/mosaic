# UI Contracts: Web Frontend

**Feature**: 004-web-frontend | **Date**: 2026-03-04

## Pages

### `/` — Feed (Home)

| Element | Source | Behavior |
|---------|--------|----------|
| Filter bar | Static (All, Blindspot, Balanced) | Clicking a filter re-fetches `GET /api/v1/feed?filter=X&offset=0` |
| Story cards | `GET /api/v1/feed?limit=20&offset=N` | Infinite scroll: load next page when user scrolls near bottom |
| Bias bar per card | `left_count`, `center_count`, `right_count` | Proportional colored segments (blue/mauve/terracotta) |
| Blindspot badge | `is_blindspot === true` | Shows badge with `blindspot_perspective` label |
| Empty state | `stories.length === 0` | Friendly message: "No stories yet" |
| Error banner | fetch failure | Retry button, dismissable |

### `/story/[id]` — Story Detail

| Element | Source | Behavior |
|---------|--------|----------|
| Story header | `GET /api/v1/story/{id}` | Headline, summary, published time, bias bar |
| Source list | `story.articles` grouped by `source.bias_rating` | Three sections: Left, Center, Right. Each article: outlet name, title, snippet, external link (opens new tab) |
| "Explore Perspectives" button | Static | Navigates to `/chat/[storyId]` |
| "Start Debate" button | Static | Navigates to `/debate/[storyId]` |
| Back navigation | Static | Returns to feed (preserves scroll position) |

### `/chat/[storyId]` — Chat

| Element | Source | Behavior |
|---------|--------|----------|
| Perspective tabs | `GET /api/v1/chat/{storyId}/perspectives` | Left/Center/Right tabs. Disabled + tooltip if `available === false` |
| Message list | `GET /api/v1/chat/conversations/{id}` | Scrollable, auto-scroll to bottom on new messages |
| Streaming text | SSE from `POST /api/v1/chat/{storyId}/stream` | Token-by-token rendering with typing indicator |
| Citations | `citation` SSE event | Expandable cards with source name, article title, quoted text, link |
| Input field | User input | Send button disabled while streaming. Max 2000 chars |
| AI disclaimer | Static | "This is an AI perspective, not a real person" |
| Conversation ended | `ended` SSE event | Banner: "Conversation ended" with reason |

### `/debate/[storyId]` — Debate

| Element | Source | Behavior |
|---------|--------|----------|
| Persona selector | `GET /api/v1/chat/{storyId}/perspectives` | Pick 2–3 perspectives. Disabled if `available === false` |
| Start button | User action | `POST /api/v1/debate/{storyId}/start` with selected personas |
| Debate turns | SSE from `POST /api/v1/debate/{debateId}/round` | Each turn: role label (colored), streaming content, citations |
| Round indicator | `round_start` / `round_complete` events | "Round N" header between rounds |
| "Next Round" button | `round_complete` event | `POST /api/v1/debate/{debateId}/round` |
| Moderator input | User input | `POST /api/v1/debate/{debateId}/interject`. Optional `directed_at` selector |
| Pause/Complete | User action | `PATCH /api/v1/debate/{debateId}/status` |

### `/history` — Chat & Debate History

| Element | Source | Behavior |
|---------|--------|----------|
| Tab bar | Static (Chats, Debates) | Toggle between chat and debate history lists |
| Chat list | `GET /api/v1/chat/{storyId}/conversations` (per story) | Story headline, perspective, message count, last message preview. Tap → `/chat/[storyId]` |
| Debate list | `GET /api/v1/debate/{storyId}/debates` (per story) | Story headline, personas, status, round count, last turn preview. Tap → `/debate/[storyId]` |
| Delete | Swipe/button | `DELETE /api/v1/chat/conversations/{id}` or `DELETE /api/v1/debate/{debateId}` with confirmation |
| Empty state | Empty list | "No conversations yet" / "No debates yet" |

**Note on history endpoints**: The backend history endpoints are per-story (`/chat/{storyId}/conversations`, `/debate/{storyId}/debates`). The history page will need to aggregate across stories. Two approaches: (1) maintain a list of story IDs the user has interacted with (in-memory or URL state), or (2) request a backend endpoint that lists all conversations/debates across stories. The current API does not have a global "all conversations" endpoint — this should be addressed in task planning. For MVP, the history page can show a feed of stories the user has visited (tracked in React state during the session).

## Shared Components

### BottomNav

- Fixed to bottom of viewport
- 3 buttons: Feed (home icon), Chats (chat icon), Debates (debate icon)
- Active state: highlighted with primary color
- Visible on all pages

### BiasBar

- Props: `leftCount`, `centerCount`, `rightCount`
- Renders proportional colored bar (blue | mauve | terracotta)
- Min segment width for visibility when count is small

### ErrorBanner

- Props: `message`, `onRetry`, `onDismiss`
- Sticky top banner, error red background
- Shows when backend is unreachable

### LoadingSkeleton

- Shimmer animation matching card/list layouts
- Used during initial data fetches

## Theme Tokens (CSS Custom Properties)

```css
:root {
  --color-primary: #5B9BD5;
  --color-primary-active: #4A87BE;
  --color-primary-light: #D6E8F5;
  --color-left: #5B9BD5;
  --color-center: #A0659A;
  --color-right: #C0605A;
  --color-success: #3A9E82;
  --color-bg-app: #F2EDE8;
  --color-bg-surface: #F8F5F1;
  --color-bg-card: #FFFFFF;
  --color-border: #E4DDD6;
  --color-text-primary: #1A1612;
  --color-text-secondary: #4A4440;
  --color-text-muted: #7A736C;
  --color-error-bg: #FDE8E8;
  --color-error-text: #B04040;
}
```
