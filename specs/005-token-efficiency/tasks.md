# Tasks: API Token Efficiency & Prompt Optimization

**Input**: Design documents from `/specs/005-token-efficiency/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Rollout is incremental: P1→P2→P3→P4 with validation between each.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration additions and shared utilities needed across all user stories

- [X] T001 Add token budget, cost model, and alert threshold settings to backend/src/core/config.py — add all new settings from data-model.md: `token_budget_chat`, `token_budget_debate`, `context_window_recent_messages`, `model_cost_input_per_million`, `model_cost_output_per_million`, `model_cost_cache_read_per_million`, `model_cost_cache_write_per_million`, `alert_conversation_cost_threshold`, `alert_daily_spend_threshold`, `alert_cache_hit_rate_minimum`, `alert_webhook_url`, `usage_retention_days`, `summary_precompute_threshold`, `summary_precompute_ttl_hours`
- [X] T002 Replace word-count token estimation with SDK-based accurate counting in backend/src/services/chat/chunking_service.py — update `count_tokens()` to use the Anthropic SDK's token counting (or tiktoken `cl100k_base` fallback), keeping the same function signature for backward compatibility

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Restructure system prompt format from string to content blocks — required before prompt caching (US1) or any service that consumes the system prompt

**⚠️ CRITICAL**: US1 prompt caching depends on structured content blocks. This must complete first.

- [X] T003 Refactor `build_system_prompt()` in backend/src/services/chat/persona_service.py to return a list of content block dicts instead of a single string — split into three ordered blocks: Block 1 (persona identity + 7 rules), Block 2 (story headline + RAG chunks), Block 3 (conversation summary, if any). Each block is `{"type": "text", "text": "..."}`. Do NOT add `cache_control` yet (that's US1). Include a helper `build_system_prompt_string()` that joins blocks into a single string for backward compat during transition.
- [X] T004 Update `stream_chat_response()` in backend/src/services/chat/chat_service.py to accept and pass structured content blocks as the `system` parameter to `client.messages.stream()` instead of a string — use the new list-of-dicts format from persona_service
- [X] T005 Update `_build_debate_system_prompt()` and streaming call in backend/src/services/debate/debate_service.py to use structured content blocks — append debate-specific rules (rules 8-11) as additional text in Block 1, then pass list-of-dicts as `system` parameter

**Checkpoint**: All streaming calls now use structured content blocks. System behavior is functionally identical (no caching yet).

---

## Phase 3: User Story 1 — Reduced Cost Per Conversation (Priority: P1) 🎯 MVP

**Goal**: Enable Anthropic prompt caching on stable system prompt prefixes to reduce input token costs by 40%+

**Independent Test**: Send 2+ messages in a chat conversation on the same story. Verify `cache_read_input_tokens > 0` in API response on the second message. Compare average input cost per message before/after enablement.

### Implementation for User Story 1

- [X] T006 [US1] Add `cache_control={"type": "ephemeral"}` markers to Block 1 and Block 2 in backend/src/services/chat/persona_service.py — modify the content block dicts returned by `build_system_prompt()` so Block 1 (persona rules) and Block 2 (story+RAG) each include `"cache_control": {"type": "ephemeral"}`. Block 3 (variable summary) must NOT have cache_control.
- [X] T007 [US1] Extract and log cache metrics from streaming response in backend/src/services/chat/chat_service.py — after the stream completes, read `stream.get_final_message().usage` to capture `cache_creation_input_tokens` and `cache_read_input_tokens`. Log these values at INFO level.
- [X] T008 [US1] Extract and log cache metrics from streaming response in backend/src/services/debate/debate_service.py — same as T007 but for debate streaming. Read usage from stream final message and log cache hit/miss metrics.
- [X] T009 [US1] Add `usage` SSE event emission in backend/src/services/chat/chat_service.py — after the `done` event, emit a `{"type": "usage", "input_tokens": ..., "output_tokens": ..., "cache_read_tokens": ..., "estimated_cost_usd": ...}` event using the captured metrics from T007. Calculate estimated cost using config pricing settings from T001.
- [X] T010 [US1] Add `usage` SSE event emission in backend/src/services/debate/debate_service.py — same as T009 but for debate streaming.
- [X] T011 [US1] Add graceful fallback for cache miss/failure in backend/src/services/chat/chat_service.py — wrap the cache_control-enabled call in a try/except. If the API rejects `cache_control` (e.g., unsupported model), fall back to sending system prompt without cache_control markers. Log a warning on fallback.
- [X] T012 [US1] Add graceful fallback for cache miss/failure in backend/src/services/debate/debate_service.py — same fallback pattern as T011 for debate streaming.

**Checkpoint**: Prompt caching is active for both chat and debate. Cache hit metrics are logged. Fallback works on unsupported models. Validate SC-001 (40% cost reduction) and SC-002 (60% cache hit rate).

---

## Phase 4: User Story 2 — Smarter Context Window Management (Priority: P2)

**Goal**: Replace all-or-nothing context summarization with sliding window + progressive summary, using accurate token counting

**Independent Test**: Run a 20+ message conversation. Verify (a) total input tokens per request stays under `token_budget_chat`, (b) the AI references key points from early messages, (c) token counts logged are accurate (within 5% of provider-reported).

### Implementation for User Story 2

- [X] T013 [US2] Implement sliding window context assembly in backend/src/services/chat/context_manager.py — replace `get_conversation_context()` with a new implementation that: (1) calculates available context budget = `token_budget_chat - system_prompt_tokens - new_message_tokens`, (2) fills from newest to oldest: include last N messages (configurable via `context_window_recent_messages`, default 6) verbatim, (3) if budget remains, include rolling summary from `conversation.context_summary`, (4) if summary exceeds remaining budget, truncate summary progressively
- [X] T014 [US2] Implement progressive summarization in backend/src/services/chat/context_manager.py — replace `summarize_if_needed()` with a progressive approach: when messages exceed the sliding window size, summarize only the newly-aged-out messages by combining them with the existing `context_summary` into a new summary. Use `client.messages.create()` with max_tokens=400. Store result in `conversation.context_summary`. Only summarize messages that have "fallen off" the window, not all old messages.
- [X] T015 [US2] Apply sliding window to debate context in backend/src/services/debate/debate_service.py — update `_build_debate_history()` and `_summarize_debate_if_needed()` to use the same sliding window pattern: keep last N turns verbatim, progressive summary for older turns, respect `token_budget_debate` limit
- [X] T016 [US2] Log token count discrepancies in backend/src/services/chat/chat_service.py — after each API call, compare the pre-call estimated token count (from SDK counting in T002) with the provider-reported `usage.input_tokens`. Log a warning if discrepancy exceeds 5%. Use provider-reported count as source of truth.
- [X] T017 [US2] Log token count discrepancies in backend/src/services/debate/debate_service.py — same discrepancy logging as T016 for debate calls.

**Checkpoint**: Context window stays within budget for all conversations. Progressive summaries maintain coherence. Token counting is accurate. Validate SC-003 (99%+ budget compliance).

---

## Phase 5: User Story 3 — Token Usage Visibility & Budgeting (Priority: P3)

**Goal**: Track per-call token usage, provide reporting endpoints, and alert on threshold breaches

**Independent Test**: Process several chat/debate sessions, then query `GET /api/v1/admin/usage` and verify reported totals match expected token consumption. Check that alerts fire when thresholds are exceeded.

### Implementation for User Story 3

- [X] T018 [P] [US3] Create TokenUsage and TokenUsageDaily SQLAlchemy models in backend/src/models/token_usage.py — define both models per data-model.md with all fields, indexes, and relationships. Register in backend/src/models/__init__.py.
- [X] T019 [P] [US3] Create Alembic migration in backend/alembic/versions/005_token_usage_table.py — create `token_usage` and `token_usage_daily` tables with all columns, indexes, and the unique constraint on `(date, feature_type)` for daily table.
- [X] T020 [US3] Create usage tracking service in backend/src/services/usage/__init__.py and backend/src/services/usage/usage_service.py — implement: `record_usage(feature_type, model_name, story_id, conversation_id, debate_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens)` that calculates estimated cost from config pricing and inserts a TokenUsage record. Also implement `get_usage_report(start_date, end_date, feature_type, group_by, story_id)` and `get_cache_stats(period)` query methods per the contracts/usage-api.md spec.
- [X] T021 [US3] Integrate usage recording into chat streaming in backend/src/services/chat/chat_service.py — after stream completes and usage metrics are captured (from T007), call `usage_service.record_usage()` with feature_type="chat", the story_id, conversation_id, and all token metrics. This should be non-blocking (fire-and-forget or background task).
- [X] T022 [US3] Integrate usage recording into debate streaming in backend/src/services/debate/debate_service.py — same as T021 but for debate: feature_type="debate", with debate_id instead of conversation_id.
- [X] T023 [US3] Integrate usage recording into summarization calls in backend/src/services/chat/context_manager.py and backend/src/services/debate/debate_service.py — record usage for `client.messages.create()` summarization calls with feature_type="summarization".
- [X] T024 [US3] Create admin reporting endpoints in backend/src/api/v1/admin.py — implement `GET /api/v1/admin/usage`, `GET /api/v1/admin/usage/alerts`, and `GET /api/v1/admin/usage/cache-stats` per contracts/usage-api.md. Register router in backend/src/main.py.
- [X] T025 [US3] Create Pydantic response schemas for admin endpoints in backend/src/schemas/admin.py — define UsageReport, UsageBreakdown, AlertResponse, CacheStatsResponse schemas matching the JSON contracts.
- [X] T026 [US3] Implement threshold alerting in backend/src/services/usage/usage_service.py — add `check_conversation_alert(conversation_id)` (called inline after each chat/debate API call) and `check_periodic_alerts()` (called by Celery beat). Per-conversation: sum costs for conversation, alert if > threshold. Periodic: check daily spend and cache hit rate. Alerts logged + sent to webhook URL if configured.
- [X] T027 [US3] Add Celery tasks for usage aggregation and periodic alerts in backend/src/workers/tasks.py — add `aggregate_old_usage()` task (daily: aggregate token_usage records older than `usage_retention_days` into token_usage_daily, then delete originals) and `check_usage_alerts()` task (every 5 minutes: call `check_periodic_alerts()`). Register with Celery beat schedule.

**Checkpoint**: All API calls are tracked. Admin can query usage reports and cache stats. Alerts fire on threshold breaches. Validate SC-005 (data freshness and accuracy within 5%).

---

## Phase 6: User Story 4 — Pre-computed Summaries for Common Contexts (Priority: P4)

**Goal**: Pre-generate perspective summaries for popular stories to reduce per-request RAG token consumption by 50%+

**Independent Test**: Trigger pre-computation for a story, then start a chat on that story. Compare input token count against a non-precomputed story. Verify 50%+ reduction in RAG context tokens and 30%+ faster first response.

### Implementation for User Story 4

- [X] T028 [P] [US4] Create StorySummary SQLAlchemy model in backend/src/models/story_summary.py — define model per data-model.md with all fields, unique constraint on `(story_id, perspective)`, and indexes. Register in backend/src/models/__init__.py.
- [X] T029 [P] [US4] Create Alembic migration in backend/alembic/versions/006_story_summaries_table.py — create `story_summaries` table with all columns, unique constraint, and indexes.
- [X] T030 [US4] Create summary generator service in backend/src/services/precompute/__init__.py and backend/src/services/precompute/summary_generator.py — implement `generate_story_summary(story_id, perspective)`: retrieve all article chunks for story+perspective, send to Claude with a summarization prompt requesting a concise perspective summary, count tokens of result, compute `source_version_hash` (SHA-256 of concatenated chunk content), store as StorySummary with `expires_at = now + summary_precompute_ttl_hours`. Also implement `check_staleness(summary)` that compares stored hash against current chunk hash.
- [X] T031 [US4] Integrate pre-computed summary lookup into persona_service in backend/src/services/chat/persona_service.py — in `build_system_prompt()`, before assembling Block 2 (RAG context), check for a valid (non-expired, matching hash) StorySummary for the given story_id+perspective. If found, use `summary_text` instead of raw article chunks. If not found or expired, fall back to existing raw chunk injection.
- [X] T032 [US4] Add Celery task for pre-computation in backend/src/workers/tasks.py — implement `generate_story_summaries(story_id=None)` task: if story_id provided, generate summaries for all 3 perspectives. If no story_id, query stories where conversation count >= `summary_precompute_threshold` and no valid summary exists, then generate. Also add `cleanup_expired_summaries()` periodic task.
- [X] T033 [US4] Add admin endpoint for manual pre-computation trigger in backend/src/api/v1/admin.py — implement `POST /api/v1/admin/stories/{story_id}/precompute` that queues the Celery task and returns 202 Accepted per contracts/usage-api.md.
- [X] T034 [US4] Record pre-computation usage in backend/src/services/precompute/summary_generator.py — after each Claude summarization call for pre-computation, call `usage_service.record_usage()` with feature_type="precompute".

**Checkpoint**: Popular stories have pre-computed summaries. Chat requests on those stories use compact summaries instead of raw chunks. Validate SC-004 (30% faster first response) and 50% RAG token reduction.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T035 Add structured logging for all token optimization events across backend/src/services/ — ensure consistent log format with fields: feature_type, story_id, conversation_id/debate_id, input_tokens, output_tokens, cache_hit (bool), estimated_cost. Use Python logging with JSON formatter.
- [X] T036 Run end-to-end validation per quickstart.md — execute all verification steps from quickstart.md for each phase, document baseline vs optimized metrics for SC-001 through SC-007.
- [X] T037 Update backend/src/models/__init__.py to export all new models (TokenUsage, TokenUsageDaily, StorySummary) — ensure Alembic auto-detection works for future migrations.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (structured prompt blocks)
- **US2 (Phase 4)**: Depends on Phase 1 (accurate token counting, config settings). Independent of US1.
- **US3 (Phase 5)**: Depends on Phase 1 (config settings). Can start in parallel with US1/US2, but benefits from US1 cache metrics being available.
- **US4 (Phase 6)**: Depends on Phase 1 (config settings). Can start in parallel with US1-US3, but benefits from US3 usage tracking.
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 (structured blocks). No dependency on other stories.
- **US2 (P2)**: Requires Phase 1 (token counting). No dependency on US1.
- **US3 (P3)**: Requires Phase 1 (config). Integrates with US1 (cache metrics) and US2 (summarization usage), but can be developed independently — just won't have cache data until US1 is deployed.
- **US4 (P4)**: Requires Phase 1 (config). Integrates with US3 (usage tracking for precompute calls), but can be developed independently.

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration/fallback handling

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T004 and T005 can run in parallel (different files, both depend on T003)
- T007 and T008 can run in parallel (chat vs debate, same pattern)
- T009 and T010 can run in parallel (chat vs debate SSE events)
- T011 and T012 can run in parallel (chat vs debate fallbacks)
- T016 and T017 can run in parallel (chat vs debate discrepancy logging)
- T018 and T019 can run in parallel (model and migration)
- T028 and T029 can run in parallel (model and migration)
- US2 and US3 can be developed in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch in parallel:
Task T007: "Extract cache metrics from chat stream in backend/src/services/chat/chat_service.py"
Task T008: "Extract cache metrics from debate stream in backend/src/services/debate/debate_service.py"

# Then in parallel:
Task T009: "Add usage SSE event in chat_service.py"
Task T010: "Add usage SSE event in debate_service.py"

# Then in parallel:
Task T011: "Add cache fallback in chat_service.py"
Task T012: "Add cache fallback in debate_service.py"
```

## Parallel Example: User Story 3

```bash
# Launch model + migration in parallel:
Task T018: "Create TokenUsage models in backend/src/models/token_usage.py"
Task T019: "Create migration in backend/alembic/versions/005_token_usage_table.py"

# Then sequential: service → integration → endpoints
Task T020: "Create usage_service.py"
Task T021 + T022 + T023: "Integrate recording into chat, debate, summarization" (T021/T022 parallel)
Task T024 + T025: "Create admin endpoints + schemas" (parallel)
Task T026: "Implement alerting"
Task T027: "Add Celery tasks"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 (T006-T012)
4. **STOP and VALIDATE**: Verify cache hits on second message, measure cost reduction
5. Deploy if 40%+ cost savings confirmed

### Incremental Delivery

1. Setup + Foundational → Structured prompts working
2. Add US1 (prompt caching) → Validate SC-001, SC-002 → Deploy ✅
3. Add US2 (context window) → Validate SC-003 → Deploy ✅
4. Add US3 (usage tracking) → Validate SC-005 → Deploy ✅
5. Add US4 (pre-computed summaries) → Validate SC-004 → Deploy ✅
6. Polish → Validate SC-006, SC-007 → Final deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Recommended: deploy US1 first for immediate cost savings before continuing
