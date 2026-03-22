# Quickstart: API Token Efficiency & Prompt Optimization

**Feature Branch**: `005-token-efficiency`
**Date**: 2026-03-22

## Prerequisites

- Python 3.11+
- PostgreSQL with existing mosaic schema
- Redis running
- Anthropic API key with prompt caching support
- Existing backend running (`backend/src/main.py`)

## Phase 1 (P1): Prompt Caching

### Files to Modify

1. **`backend/src/services/chat/persona_service.py`**
   - Refactor `build_system_prompt()` to return structured content blocks instead of a single string
   - Add `cache_control: {"type": "ephemeral"}` on stable prefix blocks

2. **`backend/src/services/chat/chat_service.py`**
   - Update `stream_chat_response()` to pass system prompt as list of content blocks
   - Extract and log cache metrics from stream response

3. **`backend/src/services/debate/debate_service.py`**
   - Same changes as chat_service for debate streaming
   - Update `_build_debate_system_prompt()` to return structured blocks

### Verification

```bash
# Start a chat session, send 2+ messages on the same story
# Check logs for cache_read_input_tokens > 0 on second message
```

## Phase 2 (P2): Context Window Management

### Files to Modify

1. **`backend/src/services/chat/context_manager.py`**
   - Replace `count_tokens()` with SDK-based token counting
   - Implement sliding window: keep last N messages verbatim, progressive summary for older
   - Add token budget enforcement

2. **`backend/src/services/chat/chunking_service.py`**
   - Update `count_tokens()` to use accurate tokenizer

3. **`backend/src/core/config.py`**
   - Add `token_budget_chat`, `token_budget_debate`, `context_window_recent_messages`

### Verification

```bash
# Run a 20+ message conversation
# Verify total input tokens stays under token_budget_chat
# Verify rolling summary is coherent
```

## Phase 3 (P3): Usage Tracking & Reporting

### Files to Create

1. **`backend/src/models/token_usage.py`** — SQLAlchemy models
2. **`backend/alembic/versions/005_token_usage_table.py`** — Migration
3. **`backend/src/services/usage/usage_service.py`** — Tracking + aggregation logic
4. **`backend/src/api/v1/admin.py`** — Admin reporting endpoints
5. **`backend/src/workers/tasks.py`** — Add aggregation + alert tasks

### Files to Modify

1. **`backend/src/services/chat/chat_service.py`** — Record usage after each API call
2. **`backend/src/services/debate/debate_service.py`** — Record usage after each API call
3. **`backend/src/core/config.py`** — Add cost model + alert threshold settings

### Verification

```bash
# Run alembic migration
alembic upgrade head

# Process several conversations, then query usage
curl http://localhost:8000/api/v1/admin/usage?period=24h
```

## Phase 4 (P4): Pre-computed Summaries

### Files to Create

1. **`backend/src/models/story_summary.py`** — SQLAlchemy model
2. **`backend/alembic/versions/006_story_summaries_table.py`** — Migration
3. **`backend/src/services/precompute/summary_generator.py`** — Generation logic

### Files to Modify

1. **`backend/src/services/chat/persona_service.py`** — Check for pre-computed summary before raw chunks
2. **`backend/src/workers/tasks.py`** — Add pre-computation task + threshold trigger
3. **`backend/src/core/config.py`** — Add threshold + TTL settings

### Verification

```bash
# Trigger pre-computation for a story
curl -X POST http://localhost:8000/api/v1/admin/stories/1/precompute

# Start chat on that story, compare input token count vs. non-precomputed story
```

## Key Architecture Decisions

- **No new infrastructure**: All optimizations use existing Anthropic SDK features, PostgreSQL, Redis, and Celery
- **Backward compatible**: Existing API contracts unchanged; caching is transparent to clients
- **Incremental rollout**: Each phase is independently deployable and testable
- **Fail-safe**: Cache misses and pre-computation failures fall back to current behavior
