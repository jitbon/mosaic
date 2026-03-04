# Tasks: Biased News Feed

**Input**: Design documents from `/specs/001-biased-news-feed/`
**Prerequisites**: spec.md (user stories with priorities P1-P3)

**Tests**: Not requested in specification - focusing on implementation tasks only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile + API architecture**: `mobile/` and `backend/` at repository root
- Mobile: React Native + Expo structure
- Backend: FastAPI + Python structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for mobile app and backend API

- [X] T001 Create mobile/ directory with Expo project structure
- [X] T002 Create backend/ directory with FastAPI project structure
- [X] T003 [P] Initialize Expo app with TypeScript in mobile/ using `npx create-expo-app`
- [X] T004 [P] Initialize FastAPI project with Poetry/pip in backend/
- [X] T005 [P] Configure ESLint and Prettier for mobile/ codebase
- [X] T006 [P] Configure Black and Ruff for backend/ codebase
- [X] T007 [P] Create mobile/.env.example with EXPO_PUBLIC_API_URL variable
- [X] T008 [P] Create backend/.env.example with GNEWS_API_KEY, SUPABASE_URL, SUPABASE_KEY, REDIS_URL
- [X] T009 Create mobile/app/(tabs)/_layout.tsx for tab navigation structure
- [X] T010 Create backend/src/core/config.py for environment configuration using Pydantic Settings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Storage Setup

- [X] T011 Create backend/alembic.ini and initialize Alembic migrations framework
- [X] T012 Create backend/alembic/versions/001_initial_schema.py with sources, stories, articles tables
- [X] T013 Add pgvector extension setup to migration in backend/alembic/versions/001_initial_schema.py
- [X] T014 Create indexes for stories.published_at and articles.story_id in backend/alembic/versions/001_initial_schema.py
- [X] T015 Create backend/src/core/database.py with Supabase client initialization

### API Infrastructure

- [X] T016 Create backend/src/main.py with FastAPI app initialization and CORS middleware
- [X] T017 Create backend/src/api/deps.py for dependency injection (DB sessions, cache clients)
- [X] T018 [P] Create backend/src/core/cache.py with Redis client initialization
- [X] T019 [P] Create backend/src/api/errors.py with custom exception handlers
- [X] T020 [P] Create backend/src/api/middleware.py with logging and error handling middleware

### Data Models

- [X] T021 Create backend/src/models/source.py with Source SQLAlchemy model (id, name, domain, bias_rating, confidence)
- [X] T022 Create backend/src/models/story.py with Story SQLAlchemy model (id, headline, summary, published_at, left_count, center_count, right_count, is_blindspot computed column)
- [X] T023 Create backend/src/models/article.py with Article SQLAlchemy model (id, story_id FK, source_id FK, title, url, published_at, snippet, image_url, embedding vector)

### API Schemas (Pydantic)

- [X] T024 [P] Create backend/src/schemas/source.py with SourceBase, SourceRead Pydantic schemas
- [X] T025 [P] Create backend/src/schemas/story.py with StoryBase, StoryRead, StoryWithCoverage Pydantic schemas
- [X] T026 [P] Create backend/src/schemas/article.py with ArticleBase, ArticleRead Pydantic schemas
- [X] T027 [P] Create backend/src/schemas/feed.py with FeedResponse, PaginationMeta Pydantic schemas

### Mobile Foundational Components

- [X] T028 Create mobile/services/api.ts with axios/fetch wrapper and base URL configuration
- [X] T029 Create mobile/services/cache.ts with expo-sqlite offline cache manager
- [X] T030 [P] Create mobile/types/story.ts with Story, Article, Source TypeScript interfaces
- [X] T031 [P] Create mobile/types/feed.ts with FeedResponse, PaginationMeta TypeScript interfaces
- [X] T032 Create mobile/hooks/useOfflineCache.ts for expo-sqlite cache operations
- [X] T033 Create mobile/constants/config.ts with API URLs, cache TTLs, and app configuration

### External Services Integration

- [X] T034 Create backend/data/allsides_sources.json with bootstrapped bias ratings dataset (10-15 sources per bias category)
- [X] T035 Create backend/src/services/bias/bias_service.py to load and query AllSides bias ratings from JSON file
- [X] T036 Create backend/src/services/ingestion/gnews_client.py with GNews API wrapper (async httpx client, rate limiting, error handling)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View News Stories with Bias Coverage (Priority: P1) 🎯 MVP

**Goal**: Users open the app and see a feed of current news stories, each displaying a Left/Center/Right coverage bar showing which political perspectives are reporting on that story.

**Independent Test**: Load the app and verify that stories appear with accurate bias distribution bars.

**Acceptance Criteria**:
- User sees list of current news stories sorted by recency
- Each story displays visual coverage bar showing Left/Center/Right distribution
- Coverage bar accurately reflects source distribution (e.g., 5 left, 2 center, 0 right shows heavy left bias)

### Backend Implementation for US1

- [X] T037 [P] [US1] Create backend/src/services/clustering/embeddings.py with sentence-transformers model loading (all-MiniLM-L6-v2)
- [X] T038 [P] [US1] Create backend/src/services/clustering/clustering_service.py with HDBSCAN clustering logic for story grouping
- [X] T039 [US1] Create backend/src/services/ingestion/ingestion_service.py to fetch articles from GNews and populate database (depends on T037, T038)
- [X] T040 [US1] Create backend/src/services/feed/feed_service.py to aggregate stories with coverage distribution calculation
- [X] T041 [US1] Create backend/src/api/v1/feed.py with GET /api/v1/feed endpoint (query params: limit, offset)
- [X] T042 [US1] Implement Redis caching in feed endpoint (15-min TTL) in backend/src/api/v1/feed.py
- [X] T043 [US1] Add feed route to FastAPI router in backend/src/main.py
- [X] T044 [US1] Create backend/src/workers/celery_app.py for Celery background task setup
- [X] T045 [US1] Create backend/src/workers/tasks.py with scheduled ingestion task (every 15-30 min)

### Mobile Implementation for US1

- [X] T046 [P] [US1] Create mobile/components/feed/BiasBar.tsx with Left/Center/Right visual coverage bar component
- [X] T047 [P] [US1] Create mobile/components/feed/StoryCard.tsx displaying story headline, timestamp, bias bar, and sample image
- [X] T048 [P] [US1] Create mobile/components/feed/FeedList.tsx with FlashList virtualized list for performance
- [X] T049 [US1] Create mobile/hooks/useFeed.ts with TanStack Query hook for feed data fetching and caching
- [X] T050 [US1] Create mobile/app/(tabs)/index.tsx main feed screen with FeedList integration
- [X] T051 [US1] Implement pull-to-refresh in mobile/app/(tabs)/index.tsx using RefreshControl
- [X] T052 [US1] Add loading state and error handling in mobile/app/(tabs)/index.tsx
- [X] T053 [US1] Implement offline cache read in mobile/hooks/useFeed.ts for instant load on app reopen

**Checkpoint**: At this point, User Story 1 should be fully functional - users can view news feed with bias coverage bars

---

## Phase 4: User Story 2 - Identify Blind Spot Stories (Priority: P2)

**Goal**: Users can quickly identify stories that are primarily covered by only one political perspective (80%+ single perspective).

**Independent Test**: Filter or highlight stories with heavy coverage imbalance and verify blindspot indicator appears.

**Acceptance Criteria**:
- Stories with 80%+ coverage from one perspective show "Blindspot" indicator
- Tapping Blindspot indicator explains which perspective dominates
- User can filter to show/hide Blindspot stories

### Backend Implementation for US2

- [X] T054 [US2] Add is_blindspot computed column logic verification in backend/src/models/story.py (already defined in foundational, verify calculation)
- [X] T055 [US2] Update backend/src/api/v1/feed.py to support filter query parameter (all, blindspot, balanced)
- [X] T056 [US2] Implement blindspot filtering logic in backend/src/services/feed/feed_service.py
- [X] T057 [US2] Add blindspot_perspective field to StoryWithCoverage schema in backend/src/schemas/story.py

### Mobile Implementation for US2

- [X] T058 [P] [US2] Create mobile/components/feed/BlindspotBadge.tsx component with visual indicator and perspective label
- [X] T059 [US2] Update mobile/components/feed/StoryCard.tsx to display BlindspotBadge when is_blindspot is true
- [X] T060 [US2] Create mobile/components/feed/FilterButtons.tsx with All/Blindspot/Balanced filter options
- [X] T061 [US2] Add filter state management to mobile/hooks/useFeed.ts with query param updates
- [X] T062 [US2] Integrate FilterButtons into mobile/app/(tabs)/index.tsx above FeedList
- [X] T063 [US2] Implement Blindspot explanation modal in mobile/components/feed/BlindspotExplanation.tsx
- [X] T064 [US2] Add modal trigger to BlindspotBadge tap in mobile/components/feed/StoryCard.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Refresh and Pull Latest Stories (Priority: P3)

**Goal**: Users can manually refresh the feed or rely on automatic updates to see the latest news stories.

**Independent Test**: Pull to refresh and verify new stories appear; simulate background refresh.

**Acceptance Criteria**:
- Pull-to-refresh gesture fetches latest stories
- Background app updates feed automatically
- Network errors show clear message, cached stories remain visible

### Backend Implementation for US3

- [X] T065 [US3] Create backend/src/api/v1/refresh.py with POST /api/v1/refresh endpoint
- [X] T066 [US3] Implement cache invalidation logic in refresh endpoint in backend/src/api/v1/refresh.py
- [X] T067 [US3] Add rate limiting (5 req/min per IP) to refresh endpoint in backend/src/api/v1/refresh.py
- [X] T068 [US3] Return new_stories_count and updated_stories_count in refresh response

### Mobile Implementation for US3

- [X] T069 [US3] Enhance pull-to-refresh in mobile/app/(tabs)/index.tsx to call POST /api/v1/refresh
- [X] T070 [US3] Implement background refresh using expo-task-manager in mobile/services/backgroundRefresh.ts
- [X] T071 [US3] Add network error handling with user-friendly messages in mobile/hooks/useFeed.ts
- [X] T072 [US3] Implement stale-while-revalidate pattern in mobile/hooks/useFeed.ts with TanStack Query
- [X] T073 [US3] Add refresh timestamp display in mobile/app/(tabs)/index.tsx ("Updated 2 minutes ago")

**Checkpoint**: All three user stories (US1, US2, US3) should now be independently functional

---

## Phase 6: User Story 4 - Browse Story Details (Priority: P3)

**Goal**: Users can tap on any story to view detailed information, including source attribution and coverage from different perspectives.

**Independent Test**: Tap a story and verify detail view displays source information with bias labels.

**Acceptance Criteria**:
- Tapping story navigates to detail view with headline, summary, source list
- Each source shows bias rating (Left/Center/Right)
- Tapping source opens article in external browser or in-app

### Backend Implementation for US4

- [X] T074 [US4] Create backend/src/api/v1/story.py with GET /api/v1/story/{id} endpoint
- [X] T075 [US4] Implement story detail fetch with related articles in backend/src/services/feed/feed_service.py
- [X] T076 [US4] Add Redis caching (30-min TTL) to story detail endpoint
- [X] T077 [US4] Create StoryDetailResponse schema in backend/src/schemas/story.py with articles array

### Mobile Implementation for US4

- [X] T078 [P] [US4] Create mobile/app/(tabs)/story/[id].tsx dynamic route for story detail screen
- [X] T079 [P] [US4] Create mobile/components/story/StoryHeader.tsx with headline and summary
- [X] T080 [P] [US4] Create mobile/components/story/SourceList.tsx displaying articles grouped by bias
- [X] T081 [P] [US4] Create mobile/components/story/ArticleLink.tsx with source name, bias badge, and external link handler
- [X] T082 [US4] Create mobile/hooks/useStory.ts with TanStack Query hook for story detail fetching
- [X] T083 [US4] Integrate StoryHeader and SourceList into mobile/app/(tabs)/story/[id].tsx
- [X] T084 [US4] Implement navigation from StoryCard tap to story detail in mobile/components/feed/StoryCard.tsx
- [X] T085 [US4] Add external link handling with Linking.openURL in mobile/components/story/ArticleLink.tsx

**Checkpoint**: All user stories (US1-US4) should now be fully functional and independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T086 [P] Add loading skeletons for feed and story detail in mobile/components/common/LoadingSkeleton.tsx
- [X] T087 [P] Implement error boundary in mobile/components/common/ErrorBoundary.tsx
- [X] T088 [P] Add accessibility labels (accessibilityLabel, accessibilityRole) to all interactive components
- [X] T089 [P] Optimize image loading with expo-image and blurhash placeholders
- [X] T090 [P] Add CDN caching headers (Cache-Control: public, max-age=300) to backend/src/api/v1/feed.py
- [X] T091 [P] Create materialized view feed_cache in Alembic migration for performance optimization
- [X] T092 [P] Add logging for API errors and slow queries in backend/src/api/middleware.py
- [X] T093 Update mobile/README.md with setup instructions and environment variables
- [X] T094 Update backend/README.md with API endpoints, deployment guide, and GNews API setup
- [X] T095 Create root README.md with project overview, architecture diagram, and quickstart
- [ ] T096 Performance testing: Verify 2-second load time target on mobile simulator
- [ ] T097 Manual testing: Validate all acceptance criteria from spec.md across all user stories

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ FULLY INDEPENDENT
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable ✅ FULLY INDEPENDENT
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Adds refresh to US1 but independently testable ✅ FULLY INDEPENDENT
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Adds detail view to US1 but independently testable ✅ FULLY INDEPENDENT

### Within Each User Story

- Backend tasks generally before mobile tasks (API must exist for mobile to consume)
- Models → Services → Endpoints (backend dependency chain)
- Components → Hooks → Screens (mobile dependency chain)
- Tasks marked [P] within a story can run in parallel

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005, T006, T007, T008 can all run in parallel (10 parallel tasks)

**Phase 2 (Foundational)**: T018, T019, T020, T024, T025, T026, T027, T030, T031 can run in parallel (9 parallel tasks)

**Phase 3 (US1)**: T037, T038, T046, T047, T048 can run in parallel (5 parallel tasks)

**Phase 4 (US2)**: T058 can start immediately, T060, T063 in parallel (3 parallel tasks)

**Phase 5 (US3)**: Mostly sequential due to dependencies

**Phase 6 (US4)**: T078, T079, T080, T081 can run in parallel (4 parallel tasks)

**Phase 7 (Polish)**: T086, T087, T088, T089, T090, T091, T092 can all run in parallel (7 parallel tasks)

**Cross-Story Parallelism**: Once Phase 2 completes, all 4 user stories (US1, US2, US3, US4) can be developed in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch these US1 tasks in parallel:

# Backend team can work on these together:
Task T037: Create backend/src/services/clustering/embeddings.py
Task T038: Create backend/src/services/clustering/clustering_service.py

# Mobile team can work on these together:
Task T046: Create mobile/components/feed/BiasBar.tsx
Task T047: Create mobile/components/feed/StoryCard.tsx
Task T048: Create mobile/components/feed/FeedList.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (10 tasks, ~2-3 hours)
2. Complete Phase 2: Foundational (26 tasks, ~1-2 days) **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (17 tasks, ~2-3 days)
4. **STOP and VALIDATE**: Test User Story 1 independently against acceptance criteria
5. Deploy/demo if ready - **this is your MVP!**

**MVP Delivers**: News feed with bias coverage visualization (core value proposition)

### Incremental Delivery (All User Stories)

1. Complete Setup + Foundational → Foundation ready (~2-3 days)
2. Add User Story 1 → Test independently → Deploy/Demo (**MVP**, ~2-3 days)
3. Add User Story 2 → Test independently → Deploy/Demo (blindspot detection, ~1 day)
4. Add User Story 3 → Test independently → Deploy/Demo (refresh functionality, ~0.5-1 day)
5. Add User Story 4 → Test independently → Deploy/Demo (story details, ~1-2 days)
6. Polish phase → Final testing and optimization (~1 day)

**Total Estimate**: ~7-10 days for full feature with all 4 user stories

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (~2-3 days)
2. Once Foundational is done:
   - **Developer A**: User Story 1 + User Story 2 (backend + mobile)
   - **Developer B**: User Story 3 + User Story 4 (backend + mobile)
3. Stories complete and integrate independently
4. Both tackle Polish phase together

**Parallel Estimate**: ~5-7 days for all 4 user stories

---

## Task Summary

**Total Tasks**: 97 tasks

**Task Count per Phase**:
- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 26 tasks
- Phase 3 (User Story 1 - P1): 17 tasks
- Phase 4 (User Story 2 - P2): 11 tasks
- Phase 5 (User Story 3 - P3): 9 tasks
- Phase 6 (User Story 4 - P3): 12 tasks
- Phase 7 (Polish): 12 tasks

**Parallel Opportunities**: 38 tasks marked [P] can run in parallel with others

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (53 tasks total for User Story 1)

**Independent Test Criteria**:
- US1: Load app, verify stories appear with bias bars
- US2: Verify blindspot indicators appear and filter works
- US3: Pull to refresh and verify new stories load
- US4: Tap story, verify detail view with source list

---

## Format Validation ✅

**Checkbox Format**: All 97 tasks follow `- [ ] [ID]` format ✅
**Task IDs**: Sequential T001-T097 ✅
**[P] Markers**: 38 tasks marked for parallel execution ✅
**[Story] Labels**: All user story tasks labeled (US1, US2, US3, US4) ✅
**File Paths**: All implementation tasks include specific file paths ✅

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All 4 user stories can be developed in parallel after Foundational phase
- Focus on MVP first (User Story 1) for fastest time to value
