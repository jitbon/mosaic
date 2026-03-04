# Tasks: Multi-Persona Debate Mode

**Input**: Design documents from `/specs/003-debate-mode/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/debate-api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Database migration and shared model/schema infrastructure for debate mode

- [x] T001 Create Debate SQLAlchemy model in backend/src/models/debate.py (fields: id, story_id, personas, status, current_round, abuse_redirect_count, context_summary, created_at, updated_at per data-model.md)
- [x] T002 Create DebateTurn SQLAlchemy model in backend/src/models/debate_turn.py (fields: id, debate_id, turn_number, role, content, summary, citations, round_number, created_at per data-model.md)
- [x] T003 Create Alembic migration for debates and debate_turns tables in backend/alembic/versions/004_debate_tables.py (indexes: debates_story_id_idx, debates_updated_at_idx, debate_turns_debate_id_idx, debate_turns_debate_turn_idx unique)
- [x] T004 Create Pydantic request/response schemas in backend/src/schemas/debate.py (DebateCreate, DebateResponse, DebateTurnResponse, DebateDetailResponse, DebateListResponse, InterjectionCreate, InterjectionResponse per contracts/debate-api.md)
- [x] T005 Create TypeScript debate interfaces in mobile/types/debate.ts (Debate, DebateTurn, SSE event types: round_start, turn_start, token, citation, turn_summary, turn_complete, round_complete, error, ended per contracts/debate-api.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core debate services and API infrastructure that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create turn_manager.py in backend/src/services/debate/turn_manager.py — turn rotation logic: given personas list and current turn_number, return next role; track round boundaries; handle 2-persona and 3-persona rotation
- [x] T007 Create summary_service.py in backend/src/services/debate/summary_service.py — parse `[SUMMARY: ...]` marker from completed persona response text; fallback to first sentence if marker missing; strip marker from display content
- [x] T008 Create debate_service.py in backend/src/services/debate/debate_service.py — core orchestration: create debate, generate a round (sequential persona turns with auto-advance), build per-turn context (debate history + RAG chunks via existing rag_service + persona system prompt via existing persona_service), stream SSE events, store turns; compose with turn_manager and summary_service
- [x] T009 Create debate API router in backend/src/api/v1/debate.py — all 6 endpoints per contracts/debate-api.md: POST start, POST round (SSE streaming), POST interject, GET list, GET detail, DELETE; wire to debate_service
- [x] T010 Register debate router in backend/src/main.py — add `app.include_router(debate_router, prefix="/api/v1/debate")`
- [x] T011 Create debate API client in mobile/services/debateApi.ts — functions: startDebate, streamRound (SSE EventSource parsing for all event types), submitInterjection, listDebates, getDebate, deleteDebate; reuse base API config from mobile/services/api.ts
- [x] T012 Create debate local storage in mobile/services/debateStorage.ts — expo-sqlite tables (debates, debate_turns per data-model.md mobile schema); CRUD operations; 30-day expiry cleanup on init
- [x] T013 Add debate API endpoint constants to mobile/constants/config.ts

**Checkpoint**: Foundation ready — debate can be created, rounds streamed, turns stored. User story implementation can now begin.

---

## Phase 3: User Story 1 — Watch a Two-Persona Debate on a Story (Priority: P1) 🎯 MVP

**Goal**: User taps "Start Debate" on a story, selects Left and Right personas, watches them debate in real-time with auto-advancing turns that collapse into expandable summaries.

**Independent Test**: Select a story, choose Left + Right, verify personas take turns with source-cited steel-manned arguments that respond to each other. Completed turns collapse to summaries; tapping expands them.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create DebatePersonaSelector component in mobile/components/debate/DebatePersonaSelector.tsx — multi-select picker for 2-3 perspectives (Left, Center, Right); disable perspectives with no source articles; min 2, max 3 selection enforcement
- [x] T015 [P] [US1] Create DebateTurn component in mobile/components/debate/DebateTurn.tsx — renders a single turn: persona label, AI disclaimer badge, streaming text (expanded) or collapsed summary; tap to toggle expand/collapse; citations inline when expanded
- [x] T016 [P] [US1] Create TurnSummary component in mobile/components/debate/TurnSummary.tsx — collapsed view showing `[Persona Label] Summary text...` with expand chevron; tap handler to toggle
- [x] T017 [P] [US1] Create DebateDisclaimer component in mobile/components/debate/DebateDisclaimer.tsx — AI disclaimer banner for debate screen (reuse pattern from mobile/components/chat/ChatDisclaimer.tsx)
- [x] T018 [US1] Create useDebate hook in mobile/hooks/useDebate.ts — state management: debate object, turns array, streaming state, current streaming turn; functions: startDebate (calls API, opens SSE), handleSSEEvents (process all event types, append turns, set summaries, auto-advance), expandTurn, collapseTurn; auto-collapse completed turns
- [x] T019 [US1] Create DebateView component in mobile/components/debate/DebateView.tsx — main debate container: ScrollView of DebateTurn components, auto-scroll to current streaming turn, round indicators; uses useDebate hook
- [x] T020 [US1] Create debate screen in mobile/app/(tabs)/debate/[storyId].tsx — route params: storyId + selected personas; shows DebatePersonaSelector initially, then DebateView after debate starts; back navigation
- [x] T021 [US1] Add "Start Debate" button to story detail screen in mobile/app/(tabs)/story/[id].tsx — alongside existing "Chat" entry point; navigates to debate/[storyId] screen

**Checkpoint**: Two-persona debate is fully functional — user can start, watch auto-advancing turns, see collapsible summaries, and expand past turns. This is the MVP.

---

## Phase 4: User Story 2 — Moderate and Steer the Debate (Priority: P2)

**Goal**: User can interject during the debate to ask questions or steer the topic. Personas address the user's input in their next turn.

**Independent Test**: Start a debate, submit an interjection, verify the next persona addresses it before continuing the debate.

### Implementation for User Story 2

- [x] T022 [P] [US2] Create ModeratorInput component in mobile/components/debate/ModeratorInput.tsx — text input bar at bottom of debate screen; submit button; 2000 char max; optional "directed at" persona selector (null = all); disabled while turn is streaming
- [x] T023 [US2] Add interjection support to useDebate hook in mobile/hooks/useDebate.ts — submitInterjection function (calls API, inserts moderator turn into turns array); handle interjection display as distinct turn type
- [x] T024 [US2] Add moderator turn rendering to DebateTurn component in mobile/components/debate/DebateTurn.tsx — distinct visual style for role="moderator" (user message appearance, no citations, no summary collapse)
- [x] T025 [US2] Integrate ModeratorInput into DebateView in mobile/components/debate/DebateView.tsx — show input bar between rounds; disable during active streaming; show after round_complete event
- [x] T026 [US2] Add interjection context handling to debate_service.py in backend/src/services/debate/debate_service.py — include moderator interjections in next persona's context; if directed_at specific persona, only that persona prioritizes addressing it

**Checkpoint**: Moderation works — user can interject, personas respond to questions, debate continues.

---

## Phase 5: User Story 3 — Three-Way Debate with Center Persona (Priority: P2)

**Goal**: User can include Center persona for a three-way debate with Left, Center, and Right.

**Independent Test**: Select all three perspectives, start debate, verify Center contributes distinct arguments and all three respond to each other.

### Implementation for User Story 3

- [x] T027 [US3] Update turn_manager.py in backend/src/services/debate/turn_manager.py — verify 3-persona rotation (Left → Center → Right) works correctly; ensure each persona sees all previous turns from all perspectives in context
- [x] T028 [US3] Add center persona RAG retrieval to debate_service.py in backend/src/services/debate/debate_service.py — Center persona retrieves center/center-left/center-right bias-labeled chunks via existing bias mapping in rag_service
- [x] T029 [US3] Update DebatePersonaSelector in mobile/components/debate/DebatePersonaSelector.tsx — ensure 3-selection state works correctly; visual feedback for 3 selected perspectives
- [x] T030 [US3] Update DebateView in mobile/components/debate/DebateView.tsx — handle 3 turns per round in display; ensure auto-scroll and collapse work with 3 personas

**Checkpoint**: Three-way debates work — Center persona contributes independently, all three respond to each other.

---

## Phase 6: User Story 4 — Review and Resume Past Debates (Priority: P3)

**Goal**: User can browse debate history, re-read past debates, and resume where they left off.

**Independent Test**: Complete a debate, navigate away, return to history, verify transcript is accessible and debate can be resumed.

### Implementation for User Story 4

- [x] T031 [P] [US4] Create useDebateHistory hook in mobile/hooks/useDebateHistory.ts — query local expo-sqlite for past debates; sorted by updated_at; include story headline, persona list, preview text; 30-day expiry filter
- [x] T032 [P] [US4] Create DebateHistoryList component in mobile/components/debate/DebateHistoryList.tsx — list of past debates with story headline, date, persona badges, topic preview; tap to open; swipe to delete
- [x] T033 [US4] Add debate history screen or tab — integrate DebateHistoryList; reuse pattern from mobile/app/(tabs)/history.tsx (existing chat history); navigate to debate/[storyId] with debate_id param to load past debate
- [x] T034 [US4] Add debate persistence to useDebate hook in mobile/hooks/useDebate.ts — save debate + turns to debateStorage after each round_complete; update on resume
- [x] T035 [US4] Add resume support to useDebate hook in mobile/hooks/useDebate.ts — load past debate from local storage; reconstruct turns list; call POST /round to continue; backend rebuilds context from stored turns + context_summary

**Checkpoint**: Debate history works — past debates accessible, transcripts viewable, debates resumable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Abuse handling, context management, rate limiting, and UX refinements

- [x] T036 Add abuse detection and redirect to debate_service.py in backend/src/services/debate/debate_service.py — check interjections for abusive content; increment abuse_redirect_count; persona redirects to substantive discussion; end debate after 3 consecutive abuse redirections per data-model.md
- [x] T037 Add context summarization to debate_service.py in backend/src/services/debate/debate_service.py — when debate history exceeds context limit, summarize earlier turns via existing context_manager; store in debate.context_summary; preserve key arguments and citations
- [x] T038 Add rate limiting to debate API in backend/src/api/v1/debate.py — 5 rounds/min per debate, 10 interjections/min per debate, 60 CRUD requests/min per IP; return 429 with X-RateLimit headers per contracts/debate-api.md
- [x] T039 Add debate status management — pause on navigate away (mobile), mark completed when user ends or abuse threshold hit; handle 409 responses for ended debates in mobile
- [x] T040 Run quickstart.md validation — verify all 5 integration scenarios work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (models + schemas + types must exist)
- **User Story 1 (Phase 3)**: Depends on Phase 2 — **this is the MVP**
- **User Story 2 (Phase 4)**: Depends on Phase 3 (US1 must work; moderation extends the debate UI)
- **User Story 3 (Phase 5)**: Depends on Phase 2 only (3-way rotation is independent of moderation)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (US1 must work; history extends persistence)
- **Polish (Phase 7)**: Depends on Phases 3-6

### User Story Dependencies

- **US1 (P1)**: Requires Foundational — no other story dependencies
- **US2 (P2)**: Requires US1 (moderation extends the debate UI and service)
- **US3 (P2)**: Requires Foundational only — can run in parallel with US1 (but MVP-first is recommended)
- **US4 (P3)**: Requires US1 (history needs a working debate to persist)

### Within Each User Story

- Models/schemas before services
- Services before API endpoints
- Backend before mobile (mobile calls API)
- Components before hooks that compose them (or parallel if independent)
- Core implementation before integration

### Parallel Opportunities

- T001, T002 can run in parallel (separate model files)
- T004, T005 can run in parallel (backend schemas + mobile types)
- T006, T007 can run in parallel (separate service files)
- T014, T015, T016, T017 can all run in parallel (separate component files)
- T022 can run in parallel with other US2 prep
- T031, T032 can run in parallel (separate hook + component files)

---

## Parallel Example: User Story 1

```bash
# Launch all independent components in parallel:
Task: "Create DebatePersonaSelector in mobile/components/debate/DebatePersonaSelector.tsx"
Task: "Create DebateTurn in mobile/components/debate/DebateTurn.tsx"
Task: "Create TurnSummary in mobile/components/debate/TurnSummary.tsx"
Task: "Create DebateDisclaimer in mobile/components/debate/DebateDisclaimer.tsx"

# Then sequentially:
Task: "Create useDebate hook" (depends on components existing)
Task: "Create DebateView" (depends on useDebate + components)
Task: "Create debate screen" (depends on DebateView)
Task: "Add Start Debate button to story detail" (depends on debate screen route existing)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T013)
3. Complete Phase 3: User Story 1 (T014–T021)
4. **STOP and VALIDATE**: Test two-persona debate end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Two-persona debate works → **MVP!**
3. Add US2 → Moderation works → Demo
4. Add US3 → Three-way debate works → Demo
5. Add US4 → History + resume works → Demo
6. Polish → Abuse handling, rate limiting, context management → Release-ready

### Suggested MVP Scope

**User Story 1 only** (T001–T021, 21 tasks). This delivers the core debate experience: start a debate, watch two personas argue with source citations, auto-advancing turns with collapsible summaries. Everything else builds incrementally on top.
