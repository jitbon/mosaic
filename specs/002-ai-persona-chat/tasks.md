# Tasks: AI Persona Chat

**Input**: Design documents from `/specs/002-ai-persona-chat/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/chat-api.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies and configuration for chat feature

- [X] T001 Add anthropic, openai, and tiktoken to backend/requirements.txt
- [X] T002 Add react-native-sse and react-native-url-polyfill to mobile/package.json and run npm install
- [X] T003 Add ANTHROPIC_API_KEY and OPENAI_API_KEY to backend/src/core/config.py Settings class
- [X] T004 Add chat API endpoint constants to mobile/constants/config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, models, and RAG infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create ArticleChunk SQLAlchemy model in backend/src/models/article_chunk.py with fields: id, article_id, story_id, bias_label, chunk_index, content, embedding (Vector 1536), metadata (JSONB), created_at
- [X] T006 Create Conversation SQLAlchemy model in backend/src/models/conversation.py with fields: id, story_id, perspective, created_at, updated_at, abuse_redirect_count, is_ended, context_summary
- [X] T007 Create Message SQLAlchemy model in backend/src/models/message.py with fields: id, conversation_id, role, content, citations (JSONB), created_at
- [X] T008 Create Alembic migration for article_chunks, conversations, and messages tables in backend/alembic/versions/003_chat_tables.py with IVFFlat index on embedding and composite indexes per data-model.md
- [X] T009 [P] Create Pydantic schemas for chat in backend/src/schemas/chat.py: ChatRequest (message, perspective, conversation_id), ChatStreamEvent (type, text, citations, etc.), ConversationResponse, ConversationListResponse, PerspectiveAvailability
- [X] T010 [P] Create TypeScript chat interfaces in mobile/types/chat.ts: Conversation, Message, Citation, ChatStreamEvent, PerspectiveAvailability, ChatRequest
- [X] T011 Create article chunking service in backend/src/services/chat/chunking_service.py: split articles into ~300-400 token paragraph-boundary chunks, prepend title + source name, embed with OpenAI text-embedding-3-small, store in article_chunks table
- [X] T012 Create RAG retrieval service in backend/src/services/chat/rag_service.py: query article_chunks by story_id + bias_label(s) using pgvector cosine similarity, re-rank with max 2 chunks per article, return top 8 chunks, format as numbered reference list
- [X] T013 Create persona system prompt builder in backend/src/services/chat/persona_service.py: generate system prompts per perspective (left/center/right) with AI disclosure, steel-man rules, citation format [N], off-topic redirect, abuse handling instructions, inject RAG context
- [X] T014 Register chat router in backend/src/main.py (import and include router from api/v1/chat.py)
- [X] T015 [P] Create mobile chat storage service in mobile/services/chatStorage.ts: expo-sqlite tables for conversations and messages, CRUD operations, 30-day expiry cleanup on app launch
- [X] T016 [P] Create mobile chat API service in mobile/services/chatApi.ts: SSE streaming client using react-native-sse for POST /chat/{storyId}/stream, REST calls for conversations list, get, delete, and perspectives check

**Checkpoint**: Foundation ready — models, schemas, RAG pipeline, and API infrastructure in place

---

## Phase 3: User Story 1 — Chat with a Single Perspective Persona (Priority: P1) 🎯 MVP

**Goal**: Users can select a perspective on a story and have a streaming AI chat grounded in source articles

**Independent Test**: Select a story, choose a perspective, send a message, verify persona responds with streamed text containing inline citations from that perspective's sources

### Implementation for User Story 1

- [X] T017 [US1] Create chat service in backend/src/services/chat/chat_service.py: orchestrate RAG retrieval → system prompt building → Claude API streaming call, handle new vs existing conversations, save user message and assistant response to DB, return SSE event generator
- [X] T018 [US1] Create context manager in backend/src/services/chat/context_manager.py: count conversation token length, summarize earlier messages via Claude when exceeding ~3000 tokens, store summary in conversation.context_summary
- [X] T019 [US1] Create streaming chat endpoint POST /api/v1/chat/{story_id}/stream in backend/src/api/v1/chat.py: validate request, call chat_service, return StreamingResponse with SSE format (token, citation, done, error events), handle rate limiting (10 msgs/min per story)
- [X] T020 [US1] Create GET /api/v1/chat/{story_id}/perspectives endpoint in backend/src/api/v1/chat.py: query article_chunks for source counts per bias_label group, return availability per perspective
- [X] T021 [US1] Create PerspectiveSelector component in mobile/components/chat/PerspectiveSelector.tsx: three tabs (Left/Center/Right) with color coding, disabled state with "No sources available" label for unavailable perspectives, calls perspectives API on mount
- [X] T022 [US1] Create ChatBubble component in mobile/components/chat/ChatBubble.tsx: message bubble with user/assistant styling, renders inline citation markers [N] as tappable links, shows "AI" badge on assistant messages
- [X] T023 [US1] Create StreamingText component in mobile/components/chat/StreamingText.tsx: renders token-by-token text using requestAnimationFrame buffer pattern, shows typing indicator while streaming
- [X] T024 [US1] Create ChatInput component in mobile/components/chat/ChatInput.tsx: text input with send button, disabled while streaming, max 2000 chars, keyboard-aware positioning
- [X] T025 [US1] Create ChatDisclaimer component in mobile/components/chat/ChatDisclaimer.tsx: persistent banner at top of chat screen stating "You are chatting with an AI persona representing [perspective] viewpoints"
- [X] T026 [US1] Create useChat hook in mobile/hooks/useChat.ts: manage SSE connection via chatApi service, buffer streaming tokens, accumulate citations, track isStreaming/error state, save completed messages to local chatStorage, expose sendMessage/stopStream functions
- [X] T027 [US1] Create chat screen in mobile/app/(tabs)/chat/[storyId].tsx: renders ChatDisclaimer, PerspectiveSelector (initially single perspective), message list with ChatBubble components, StreamingText for active response, ChatInput at bottom, loads conversation from local storage on mount
- [X] T028 [US1] Add "Explore Perspectives" button to story detail screen in mobile/app/(tabs)/story/[id].tsx: navigates to chat/[storyId] screen with story data passed via params
- [X] T029 [US1] Trigger article chunking when stories are ingested: add call to chunking_service in backend/src/services/ingestion/ingestion_service.py after articles are saved, chunk and embed articles per source bias rating

**Checkpoint**: User Story 1 complete — users can chat with a single AI persona about a story with streaming responses and source citations

---

## Phase 4: User Story 2 — Switch Between Perspectives (Priority: P2)

**Goal**: Users can switch between Left, Center, and Right tabs, each maintaining its own conversation thread

**Independent Test**: Start chat with Left persona, switch to Right, verify separate thread loads, switch back to Left, verify original thread preserved

### Implementation for User Story 2

- [X] T030 [US2] Add GET /api/v1/chat/{story_id}/conversations endpoint in backend/src/api/v1/chat.py: list all conversations for a story with message count and last message preview
- [X] T031 [US2] Add GET /api/v1/chat/conversations/{conversation_id} endpoint in backend/src/api/v1/chat.py: return full conversation with all messages and citations
- [X] T032 [US2] Update PerspectiveSelector in mobile/components/chat/PerspectiveSelector.tsx to function as a tab switcher: show active conversation indicator (message count badge), trigger perspective change callback on tap
- [X] T033 [US2] Update useChat hook in mobile/hooks/useChat.ts: manage multiple conversation threads keyed by perspective, switch active thread on perspective change, load/save per-perspective threads from local storage, preserve scroll position per thread
- [X] T034 [US2] Update chat screen in mobile/app/(tabs)/chat/[storyId].tsx: handle perspective switching via PerspectiveSelector, swap displayed message list when perspective changes, maintain separate streaming state per perspective

**Checkpoint**: Users can switch between all three perspectives with independent conversation threads preserved

---

## Phase 5: User Story 3 — Source Citation and Verification (Priority: P2)

**Goal**: Users can tap on inline citations to view source article details and navigate to original articles

**Independent Test**: Chat with persona, tap a citation marker [1], verify it shows article title, source name, bias rating, and link to original article

### Implementation for User Story 3

- [X] T035 [US3] Create CitationCard component in mobile/components/chat/CitationCard.tsx: expandable card showing source_name, article_title, bias_label badge, quoted_text, and "Read original" link that opens article_url via Linking
- [X] T036 [US3] Create CitationSheet component in mobile/components/chat/CitationSheet.tsx: bottom sheet modal listing all citations for a message, each rendered as a CitationCard
- [X] T037 [US3] Update ChatBubble in mobile/components/chat/ChatBubble.tsx: parse [N] markers in message text, render as tappable styled text, on tap open CitationSheet with that message's citations array, visually distinguish sourced claims vs persona interpretation
- [X] T038 [US3] Update chat service response in backend/src/services/chat/chat_service.py: after streaming completes, parse [N] references from response text, resolve to actual article metadata (title, url, source_name, bias_label, quoted_text), emit citation SSE event with resolved data

**Checkpoint**: Citations are tappable, showing full source details with links to original articles

---

## Phase 6: User Story 4 — Chat History and Continuity (Priority: P3)

**Goal**: Users can return to previous conversations and continue them across app sessions

**Independent Test**: Have a conversation, close the app, reopen, navigate to story, verify conversation history is displayed and continuable

### Implementation for User Story 4

- [X] T039 [US4] Create useChatHistory hook in mobile/hooks/useChatHistory.ts: load all conversations from local chatStorage, group by story, sort by updated_at, expose conversations list and delete function
- [X] T040 [US4] Create ChatHistoryList component in mobile/components/chat/ChatHistoryList.tsx: list of past conversations grouped by story headline, showing perspective badge, message count, last activity time, swipe-to-delete gesture
- [X] T041 [US4] Add DELETE /api/v1/chat/conversations/{conversation_id} endpoint in backend/src/api/v1/chat.py: delete conversation and cascade delete all messages
- [X] T042 [US4] Add chat history tab or section to app navigation: add chat history access point in mobile/app/(tabs)/_layout.tsx or as a section in the feed screen, navigates to chat history list
- [X] T043 [US4] Update chat screen in mobile/app/(tabs)/chat/[storyId].tsx: on mount, check local storage for existing conversations for this story, load and display previous messages, allow user to continue conversation

**Checkpoint**: Chat history persists across sessions, is browsable, and individual conversations can be deleted

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T044 [P] Add abuse escalation handling in backend/src/services/chat/chat_service.py: track consecutive abuse redirections, after 3 set is_ended=true, return ended SSE event with explanation message
- [X] T045 [P] Add context summarization indicator in mobile/components/chat/ChatBubble.tsx: show subtle "Earlier messages summarized" divider when conversation has context_summary
- [X] T046 [P] Add loading skeleton for chat screen in mobile/components/chat/ChatSkeleton.tsx: skeleton UI while perspectives and conversation history load
- [X] T047 [P] Add error handling for chat in mobile/components/chat/ChatErrorBoundary.tsx: handle SSE connection failures, LLM errors, and network issues with retry options
- [X] T048 Add rate limiting middleware for chat endpoints in backend/src/api/v1/chat.py: 10 messages/min per story for streaming, 60 req/min for CRUD endpoints, return 429 with rate limit headers
- [X] T049 [P] Add WCAG 2.1 AA accessibility to chat components: screen reader labels for perspective tabs, chat bubbles, citation links, and input field; announce new messages via accessibilityLiveRegion
- [X] T050 Update backend README.md with chat API endpoints documentation
- [X] T051 Run end-to-end manual validation of all quickstart.md integration scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — core chat functionality
- **US2 (Phase 4)**: Depends on US1 — extends single-persona to multi-perspective switching
- **US3 (Phase 5)**: Depends on US1 — enhances citation display (can parallel with US2)
- **US4 (Phase 6)**: Depends on US1 — adds persistence layer (can parallel with US2/US3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Requires US1 complete — extends perspective selector and chat hook
- **User Story 3 (P2)**: Requires US1 complete — can run in parallel with US2
- **User Story 4 (P3)**: Requires US1 complete — can run in parallel with US2/US3

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before mobile (for API availability)
- Core implementation before integration

### Parallel Opportunities

- T005, T006, T007 can run in parallel (different model files)
- T009, T010 can run in parallel (backend schemas vs mobile types)
- T011, T015, T016 can run in parallel (different services)
- T021-T025 can run in parallel (different mobile components)
- US2, US3, US4 can all start after US1 completes (if team capacity allows)
- All Phase 7 tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch backend components in parallel:
Task T021: "PerspectiveSelector component"
Task T022: "ChatBubble component"
Task T023: "StreamingText component"
Task T024: "ChatInput component"
Task T025: "ChatDisclaimer component"

# Then sequentially:
Task T026: "useChat hook" (depends on T022, T023)
Task T027: "Chat screen" (depends on T021-T026)
Task T028: "Story detail integration" (depends on T027)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T016)
3. Complete Phase 3: User Story 1 (T017-T029)
4. **STOP and VALIDATE**: Test single-persona chat independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 + 3 (parallel) → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo
5. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Claude API streaming requires ANTHROPIC_API_KEY in environment
- OpenAI embeddings require OPENAI_API_KEY in environment
