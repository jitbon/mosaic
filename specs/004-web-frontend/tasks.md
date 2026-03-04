# Tasks: Web Frontend

**Input**: Design documents from `/specs/004-web-frontend/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the specification. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project with all dependencies and configuration

- [ ] T001 Initialize Next.js 15 project with App Router and static export in `web/` directory — run `npx create-next-app@latest web --ts --app --tailwind --eslint --src-dir=false` then configure `next.config.ts` with `output: "export"` and API rewrites to `http://127.0.0.1:8000`
- [ ] T002 Install additional dependencies: `@microsoft/fetch-event-source` and dev dependencies: `vitest @vitejs/plugin-react @testing-library/react jsdom @playwright/test prettier`
- [ ] T003 [P] Configure Tailwind CSS 4 with Mosaic theme custom properties in `web/app/globals.css` — define CSS variables for all theme colors from `mobile/constants/theme.ts` (primary, spectrum, neutral, feedback palettes)
- [ ] T004 [P] Create theme module in `web/lib/theme.ts` exporting color constants matching `mobile/constants/theme.ts` — Brand, Spectrum, Primary, Action, Feedback, Neutral, Colors, perspectiveColor(), perspectiveActiveColor(), DebateRoleColors
- [ ] T005 [P] Create TypeScript type definitions in `web/types/feed.ts`, `web/types/story.ts`, `web/types/chat.ts`, `web/types/debate.ts` matching the API response schemas documented in `specs/004-web-frontend/data-model.md`
- [ ] T006 [P] Create API client module in `web/lib/api.ts` — typed fetch wrapper for all `/api/v1/*` endpoints (getFeed, getStory, getPerspectives, getConversations, getConversation, deleteConversation, startDebate, getDebates, getDebate, updateDebateStatus, deleteDebate, postInterjection)
- [ ] T007 [P] Create SSE streaming helper in `web/lib/sse.ts` — wrapper around `@microsoft/fetch-event-source` for POST-based SSE (chat stream, debate round stream) with typed event parsing, abort signal support, and error handling
- [ ] T008 [P] Configure Vitest in `web/vitest.config.ts` and Playwright in `web/playwright.config.ts`
- [ ] T009 [P] Copy Mosaic logo (`mosaic.png`) to `web/public/` and add favicon; update `web/app/layout.tsx` metadata with title "Mosaic" and description

**Checkpoint**: Project initialized with all dependencies, theme, types, API client, and SSE helpers ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Root layout, bottom navigation, and shared components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create root layout in `web/app/layout.tsx` — HTML structure with warm cream background (`#F2EDE8`), font setup, and `<BottomNav />` fixed to bottom of viewport
- [ ] T011 Create BottomNav component in `web/components/nav/BottomNav.tsx` — 3 buttons (Feed, Chats, Debates) with icons, active state highlighting using primary color, fixed positioning, `usePathname()` for active detection, links to `/`, `/history?tab=chats`, `/history?tab=debates`
- [ ] T012 [P] Create ErrorBanner component in `web/components/common/ErrorBanner.tsx` — sticky top banner for backend-unreachable errors with retry button and dismiss action
- [ ] T013 [P] Create LoadingSkeleton component in `web/components/common/LoadingSkeleton.tsx` — shimmer animation matching card layouts for feed, story detail, and list views

**Checkpoint**: Foundation ready — root layout renders with bottom nav, shared components available. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse News Feed (Priority: P1) 🎯 MVP

**Goal**: Users visit the app and see a paginated, filterable list of news stories with bias indicators on the home screen

**Independent Test**: Load `/`, verify stories appear with headlines/summaries/bias bars, confirm filter buttons change displayed stories, scroll to load more

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create BiasBar component in `web/components/feed/BiasBar.tsx` — proportional colored bar (blue/mauve/terracotta) from leftCount, centerCount, rightCount props with minimum segment width
- [ ] T015 [P] [US1] Create BlindspotBadge component in `web/components/feed/BlindspotBadge.tsx` — small badge showing blindspot perspective label when `is_blindspot` is true
- [ ] T016 [P] [US1] Create FilterButtons component in `web/components/feed/FilterButtons.tsx` — row of 3 buttons (All, Blindspot, Balanced) with active state styling, calls `onFilterChange` callback
- [ ] T017 [US1] Create StoryCard component in `web/components/feed/StoryCard.tsx` — card displaying headline, summary, time-ago, BiasBar, BlindspotBadge; entire card is a link to `/story/[id]`
- [ ] T018 [US1] Create useFeed hook in `web/hooks/useFeed.ts` — fetches `GET /api/v1/feed` with filter and pagination params, returns stories array, loading/error states, and `loadMore` function for infinite scroll
- [ ] T019 [US1] Create Feed page in `web/app/page.tsx` — renders FilterButtons at top, list of StoryCard components, infinite scroll via IntersectionObserver calling `loadMore`, empty state message when no stories, loading skeletons on initial load

**Checkpoint**: Feed page fully functional — users can browse stories, filter by category, and scroll for more. MVP is independently testable.

---

## Phase 4: User Story 2 — View Story Details & Sources (Priority: P1)

**Goal**: Users tap a story to see full details with source articles grouped by left/center/right perspective

**Independent Test**: Click a story card, verify headline/summary/source articles appear grouped by bias, confirm external article links open in new tabs

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create StoryHeader component in `web/components/story/StoryHeader.tsx` — displays headline, summary, published time, and BiasBar for the story
- [ ] T021 [P] [US2] Create SourceList component in `web/components/story/SourceList.tsx` — groups articles by `source.bias_rating` into Left/Center/Right sections; each article shows outlet name, title, snippet, and external link (opens in new tab)
- [ ] T022 [US2] Create useStory hook in `web/hooks/useStory.ts` — fetches `GET /api/v1/story/{id}`, returns story detail with articles, loading/error states
- [ ] T023 [US2] Create Story Detail page in `web/app/story/[id]/page.tsx` — renders StoryHeader, SourceList, "Explore Perspectives" button (links to `/chat/[id]`), "Start Debate" button (links to `/debate/[id]`), back navigation to feed

**Checkpoint**: Story detail page complete — users can view source articles grouped by perspective and navigate to chat/debate.

---

## Phase 5: User Story 3 — Navigate Between Sections (Priority: P1)

**Goal**: Users can switch between Feed, Chats, and Debates via the bottom navigation bar with instant transitions

**Independent Test**: Click each nav button, verify correct section loads with active indicator updated, verify no full-page reloads

### Implementation for User Story 3

- [ ] T024 [US3] Create History page in `web/app/history/page.tsx` — tab bar with "Chats" and "Debates" tabs (toggled via `?tab=` query param or state), renders ChatHistoryList or DebateHistoryList based on active tab, empty states for each
- [ ] T025 [P] [US3] Create ChatHistoryList component in `web/components/chat/ChatHistoryList.tsx` — placeholder list component showing "Chat history will appear here" (full implementation in US4)
- [ ] T026 [P] [US3] Create DebateHistoryList component in `web/components/debate/DebateHistoryList.tsx` — placeholder list component showing "Debate history will appear here" (full implementation in US5)
- [ ] T027 [US3] Verify navigation flow end-to-end: Feed → Story → back to Feed (scroll preserved), Feed ↔ History tabs via bottom nav, active states correctly highlighted

**Checkpoint**: All three sections navigable via bottom nav. Feed and Story detail functional. History page shows placeholder content. Core navigation is complete.

---

## Phase 6: User Story 4 — Chat with AI Perspectives (Priority: P2)

**Goal**: Users start a conversation with an AI persona (left/center/right) on a story, see streaming responses with citations, and access chat history

**Independent Test**: Select a story, choose a perspective, send a message, verify streaming response with citations appears; navigate to history, see previous conversations listed

### Implementation for User Story 4

- [ ] T028 [P] [US4] Create PerspectiveSelector component in `web/components/chat/PerspectiveSelector.tsx` — 3 tabs (Left/Center/Right) colored by spectrum, disabled with tooltip when `available === false`, shows source count per tab
- [ ] T029 [P] [US4] Create ChatBubble component in `web/components/chat/ChatBubble.tsx` — renders user (right-aligned) and assistant (left-aligned) messages with perspective color accent; assistant bubbles include expandable citation cards
- [ ] T030 [P] [US4] Create CitationCard component in `web/components/chat/CitationCard.tsx` — displays source name, article title, quoted text, bias label, and link to original article (opens in new tab)
- [ ] T031 [P] [US4] Create ChatInput component in `web/components/chat/ChatInput.tsx` — text input with send button, disabled during streaming, max 2000 chars, AI disclaimer text below input
- [ ] T032 [P] [US4] Create StreamingText component in `web/components/chat/StreamingText.tsx` — renders text that grows token-by-token with a blinking cursor during streaming
- [ ] T033 [US4] Create useChat hook in `web/hooks/useChat.ts` — manages conversation state, calls SSE stream endpoint via `web/lib/sse.ts`, handles all ChatSSEEvent types (conversation_start, token, citation, done, ended, error), tracks conversation_id for continuing conversations
- [ ] T034 [US4] Create Chat page in `web/app/chat/[storyId]/page.tsx` — renders PerspectiveSelector, message list with ChatBubble components, StreamingText for in-progress response, ChatInput at bottom, error display, conversation-ended banner
- [ ] T035 [US4] Create useChatHistory hook in `web/hooks/useChatHistory.ts` — fetches conversations from `GET /api/v1/chat/{storyId}/conversations`. Note: the backend has no global "all conversations" endpoint, so track visited story IDs in React state (populated when user opens a chat) and query each. Supports deleting via `DELETE /api/v1/chat/conversations/{id}`
- [ ] T036 [US4] Update ChatHistoryList in `web/components/chat/ChatHistoryList.tsx` — replace placeholder with real list showing story headline, perspective badge, message count, last message preview; each item links to `/chat/[storyId]?conversation={id}`

**Checkpoint**: Chat feature complete — users can start/resume conversations with AI perspectives, see streaming responses with citations, and browse chat history.

---

## Phase 7: User Story 5 — Watch AI Debates (Priority: P2)

**Goal**: Users start a debate between 2-3 AI personas, watch rounds stream in sequence, interject as moderator, and access debate history

**Independent Test**: Select a story, pick 2-3 personas, start debate, watch a round stream, submit a moderator interjection, navigate to debate history

### Implementation for User Story 5

- [ ] T037 [P] [US5] Create DebatePersonaSelector component in `web/components/debate/DebatePersonaSelector.tsx` — multi-select for 2-3 perspectives with colored checkboxes, disabled when unavailable, start button enabled when 2+ selected
- [ ] T038 [P] [US5] Create DebateTurn component in `web/components/debate/DebateTurn.tsx` — renders a single debate turn with role label (colored by perspective), content, citations, and round number; moderator turns styled differently
- [ ] T039 [P] [US5] Create ModeratorInput component in `web/components/debate/ModeratorInput.tsx` — text input for moderator interjections with optional "directed at" perspective selector dropdown, submit button
- [ ] T040 [US5] Create DebateView component in `web/components/debate/DebateView.tsx` — renders list of DebateTurn components grouped by round with "Round N" headers, streaming text for in-progress turn, "Next Round" button after round completes, pause/complete controls
- [ ] T041 [US5] Create useDebate hook in `web/hooks/useDebate.ts` — manages debate state (start, rounds, interjections), calls SSE stream for rounds via `web/lib/sse.ts`, handles all DebateSSEEvent types, tracks debate status
- [ ] T042 [US5] Create Debate page in `web/app/debate/[storyId]/page.tsx` — shows DebatePersonaSelector initially, then DebateView after start, ModeratorInput at bottom during active debate, error handling, and AI disclaimer banner ("These are AI personas representing viewpoints, not real people")
- [ ] T043 [US5] Create useDebateHistory hook in `web/hooks/useDebateHistory.ts` — fetches debates from `GET /api/v1/debate/{storyId}/debates`. Same pattern as useChatHistory: track visited story IDs in React state and query each. Supports deleting via `DELETE /api/v1/debate/{debateId}` and status updates
- [ ] T044 [US5] Update DebateHistoryList in `web/components/debate/DebateHistoryList.tsx` — replace placeholder with real list showing story headline, persona badges, status, round count, last turn preview; each item links to `/debate/[storyId]?debate={id}`

**Checkpoint**: Debate feature complete — users can start/watch/moderate debates and browse debate history.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Production integration, responsive design, and error handling across all stories

- [ ] T045 Add FastAPI static file mount in `backend/src/main.py` — mount `web/out/` via `StaticFiles(directory=..., html=True)` at root path as the LAST route (after all `/api/v1/*` routes), with conditional check that `web/out/` exists
- [ ] T046 [P] Accessibility pass across all components — semantic HTML elements (nav, main, article, section), ARIA labels on interactive elements, keyboard navigation for all buttons/links/inputs, color contrast meeting WCAG 2.1 AA (4.5:1 for text), focus indicators, skip-to-content link in layout
- [ ] T047 [P] Add responsive styles across all components — verify layout works from 375px (mobile) to 1440px+ (desktop), bottom nav stays fixed, content reflows appropriately
- [ ] T048 [P] Add connection error handling — ErrorBanner shows when backend is unreachable with retry option across all pages
- [ ] T049 [P] Add loading states with LoadingSkeleton to all pages (feed, story detail, chat, debate, history)
- [ ] T050 Add `build` script to `web/package.json` that outputs to `web/out/` and verify the full production flow: `cd web && npm run build && cd ../backend && uvicorn src.main:app` serves the web app at `/`
- [ ] T051 Run quickstart.md validation — verify both development and production workflows documented in `specs/004-web-frontend/quickstart.md` work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 (Feed), US2 (Story Detail), US3 (Navigation) are all P1 and can proceed in parallel
  - US4 (Chat) and US5 (Debate) are P2 and can proceed in parallel after foundational
  - US4 and US5 benefit from US2 being done (story detail page has the entry point buttons)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 — Browse Feed (P1)**: Can start after Phase 2. No dependencies on other stories.
- **US2 — Story Details (P1)**: Can start after Phase 2. No hard dependency on US1 (page is accessible via URL), but users naturally arrive from feed.
- **US3 — Navigation (P1)**: Can start after Phase 2. Uses placeholder content for history tabs, completed by US4/US5.
- **US4 — Chat (P2)**: Can start after Phase 2. Replaces US3 placeholder in ChatHistoryList. Entry point from US2 story detail page.
- **US5 — Debate (P2)**: Can start after Phase 2. Replaces US3 placeholder in DebateHistoryList. Entry point from US2 story detail page.

### Within Each User Story

- Components marked [P] can be built in parallel (different files)
- Hooks depend on `web/lib/api.ts` and `web/lib/sse.ts` (from Setup)
- Pages depend on their components and hooks
- Integration/validation is the last task in each story

### Parallel Opportunities

- **Phase 1**: T003–T009 are all parallel (different files)
- **Phase 2**: T012, T013 are parallel (different files)
- **Phase 3 (US1)**: T014, T015, T016 are parallel → T017 → T018 → T019
- **Phase 4 (US2)**: T020, T021 parallel → T022 → T023
- **Phase 5 (US3)**: T025, T026 parallel → T024 → T027
- **Phase 6 (US4)**: T028–T032 all parallel → T033 → T034 → T035 → T036
- **Phase 7 (US5)**: T037–T039 all parallel → T040 → T041 → T042 → T043 → T044
- **Phase 8**: T046, T047, T048, T049 all parallel

---

## Parallel Example: User Story 1

```bash
# Launch all leaf components in parallel (different files):
Task: "Create BiasBar component in web/components/feed/BiasBar.tsx"
Task: "Create BlindspotBadge component in web/components/feed/BlindspotBadge.tsx"
Task: "Create FilterButtons component in web/components/feed/FilterButtons.tsx"

# Then sequentially:
Task: "Create StoryCard component in web/components/feed/StoryCard.tsx"  # uses BiasBar, BlindspotBadge
Task: "Create useFeed hook in web/hooks/useFeed.ts"                      # uses api.ts
Task: "Create Feed page in web/app/page.tsx"                             # uses all above
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (root layout + bottom nav)
3. Complete Phase 3: User Story 1 (Feed)
4. **STOP and VALIDATE**: Load `/`, verify stories display with bias bars, filters work, infinite scroll works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Feed) → Test independently → **MVP!**
3. Add US2 (Story Detail) → Test independently → Users can browse and view stories
4. Add US3 (Navigation) → Test independently → Full navigation working
5. Add US4 (Chat) → Test independently → AI conversations available
6. Add US5 (Debate) → Test independently → Full feature set
7. Polish → Production-ready

### Parallel Team Strategy

With multiple developers after Phase 2:
- Developer A: US1 (Feed) + US2 (Story Detail) — P1 core flow
- Developer B: US3 (Navigation) + US4 (Chat) — navigation + chat
- Developer C: US5 (Debate) — debate feature

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The history page (US3) uses placeholders that are filled in by US4 and US5
- The backend API already exists — no backend changes needed except the StaticFiles mount (T045)
