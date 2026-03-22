# Research: API Token Efficiency & Prompt Optimization

**Feature Branch**: `005-token-efficiency`
**Date**: 2026-03-22

## R-001: Anthropic Prompt Caching Integration

**Decision**: Use Anthropic's native prompt caching with `cache_control={"type": "ephemeral"}` on system message content blocks.

**Rationale**: The Anthropic SDK (>=0.52.0, already installed) supports prompt caching natively. Cache hits cost 10% of standard input tokens (90% discount). The 5-minute default TTL aligns with typical user conversation cadence. No additional infrastructure required — caching is handled server-side by Anthropic.

**Key Implementation Details**:
- The current `system=system_prompt` (string) parameter must be converted to a structured list of content blocks with `cache_control` markers
- System prompt structure for caching: `[{"type": "text", "text": "<stable prefix>", "cache_control": {"type": "ephemeral"}}, {"type": "text", "text": "<variable suffix>"}]`
- Stable prefix = persona rules + RAG context (constant per story/perspective)
- Variable suffix = conversation summary (changes as conversation grows)
- Streaming calls (`messages.stream()`) support cache_control identically to `messages.create()`
- Cache metrics returned in response: `cache_creation_input_tokens`, `cache_read_input_tokens`

**Alternatives Considered**:
- **Semantic caching (Redis-based)**: Would cache full LLM responses for similar queries. Rejected because persona chat requires unique responses per conversation state, making semantic match unreliable. Could revisit for FAQ-style interactions.
- **External prompt proxy (e.g., LiteLLM)**: Adds infrastructure complexity for marginal benefit over native caching. Rejected for MVP.

## R-002: Accurate Token Counting

**Decision**: Use the `anthropic` SDK's built-in token counting via `anthropic.Anthropic().count_tokens()` or the `anthropic.count_tokens()` utility, falling back to the `tiktoken` library with the `cl100k_base` encoding as an approximation.

**Rationale**: The current `len(text.split())` approach overestimates tokens by ~30% (words != tokens). Accurate counting is needed for context budget enforcement. The Anthropic SDK provides a `count_tokens` method that uses the same tokenizer as the API. For offline/batch estimation, `tiktoken` with `cl100k_base` provides ~95% accuracy for Claude models.

**Key Implementation Details**:
- Replace `count_tokens()` in `chunking_service.py` with SDK-based counting
- Use for context budget decisions before API calls
- Provider-reported counts (from API response `usage` field) are authoritative for billing/reporting
- Log discrepancies between pre-call estimates and post-call actuals

**Alternatives Considered**:
- **Character-based estimation** (chars / 4): Too inaccurate (~60% accuracy). Rejected.
- **Provider-only counting** (post-call): Can't make pre-call budgeting decisions. Rejected as sole approach.

## R-003: Sliding Context Window Design

**Decision**: Implement a three-tier context strategy: (1) always include full system prompt, (2) keep last N messages verbatim (configurable, default 6), (3) progressively summarize older messages into a rolling summary that's updated incrementally.

**Rationale**: The current all-or-nothing summarization (summarize everything except last 4 when over threshold) loses too much context abruptly. A sliding window with progressive summarization maintains coherence while staying within budget. The rolling summary approach means we only summarize the "oldest unsummarized" messages each time, rather than re-summarizing everything.

**Key Implementation Details**:
- Context budget = `max_input_tokens - system_prompt_tokens - new_user_message_tokens`
- Fill from newest to oldest: last N messages first, then rolling summary
- If rolling summary + last N exceeds budget, truncate the summary (not the recent messages)
- Summarization call uses the same model (Haiku) with max_tokens=400
- Store rolling summary in `conversations.context_summary` (existing column)
- Progressive update: new summary = summarize(old_summary + newly-aged-out messages)

**Alternatives Considered**:
- **Embedding-based retrieval** (semantic search over message history): More complex, requires vector storage for messages. Better suited for very long conversations (50+). Deferred to future enhancement.
- **Fixed truncation** (just drop old messages): Loses context entirely. Rejected.

## R-004: Token Usage Tracking & Persistence

**Decision**: Create a new `token_usage` database table that captures metrics from every API call. Use the Anthropic API response `usage` object fields as the authoritative data source.

**Rationale**: The Anthropic API returns `usage.input_tokens`, `usage.output_tokens`, `usage.cache_creation_input_tokens`, and `usage.cache_read_input_tokens` on every response. Capturing these per-call provides the granularity needed for reporting, alerting, and cost estimation. A database table (vs. Redis or logs) supports the 90-day retention + aggregation requirement from the spec.

**Key Implementation Details**:
- New SQLAlchemy model: `TokenUsage` with fields: id, feature_type (chat/debate/summarization), story_id, conversation_id/debate_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, estimated_cost, model_name, created_at
- Cost estimation: use configurable per-model pricing (input $/1M tokens, output $/1M tokens, cache read $/1M tokens)
- Alembic migration: `005_token_usage_table.py`
- Aggregation: daily cron/celery task to aggregate records older than 90 days into `token_usage_daily` summary table
- Reporting: new API endpoint `GET /api/v1/admin/usage` with query params for date range, feature type, story_id

**Alternatives Considered**:
- **Log-only approach** (structured logging to file/stdout): Harder to query, no aggregation support. Rejected for primary storage; still used as secondary output.
- **Redis counters**: Fast but loses detail. Could supplement for real-time dashboards but not replace DB storage. Deferred.

## R-005: Pre-computed Perspective Summaries

**Decision**: Use a Celery background task to generate perspective summaries for stories that meet a popularity threshold (configurable, default: 5+ conversations started). Store summaries in a new `story_summaries` table.

**Rationale**: Pre-computation amortizes RAG processing cost across all users viewing the same story. A Celery task fits the existing async worker infrastructure. The popularity threshold prevents wasting compute on rarely-viewed stories.

**Key Implementation Details**:
- New model: `StorySummary` with fields: id, story_id, perspective (left/center/right), summary_text, source_article_ids (JSONB), source_version_hash, created_at, expires_at
- Generation: retrieve all chunks for story+perspective, send to Claude with a summarization prompt, store result
- Staleness: `source_version_hash` = hash of article chunk content; regenerate if hash changes
- TTL: 24 hours default (configurable), regenerated on access if expired
- Integration: `persona_service.build_system_prompt()` checks for pre-computed summary before falling back to raw chunks
- Celery task: `generate_story_summaries` triggered by threshold check or manual admin endpoint

**Alternatives Considered**:
- **Eager generation** (summarize all stories on ingestion): Too expensive for stories nobody reads. Rejected.
- **On-demand with cache** (generate on first request, cache for subsequent): Adds latency to first user. The threshold-based approach is a middle ground. Acceptable as fallback.

## R-006: Prompt Structure Optimization for Cache Reuse

**Decision**: Restructure system prompts into three ordered blocks: (1) static persona rules (identical across all calls), (2) story+perspective RAG context (identical per story/perspective), (3) variable content (conversation summary, dynamic instructions).

**Rationale**: Anthropic's prompt caching works on prefixes — the longer the shared prefix, the higher the cache hit rate. By ordering content from most-stable to least-stable, we maximize the cacheable prefix length. Persona rules (~500 tokens) are constant. RAG context (~1000-2000 tokens) is constant per story/perspective. Only the conversation summary changes between requests.

**Key Implementation Details**:
- Block 1 (cached): Persona identity + 7 rules → `cache_control: ephemeral`
- Block 2 (cached): Story headline + RAG chunks/pre-computed summary → `cache_control: ephemeral`
- Block 3 (uncached): Conversation summary (if any)
- For debates: add debate-specific rules (rules 8-11) at end of Block 1
- Both `chat_service.py` and `debate_service.py` must adopt structured system prompt format

**Alternatives Considered**:
- **Single cache breakpoint** (cache entire system prompt as one block): Less granular; any change to conversation summary would bust the entire cache. Rejected.
- **No restructuring** (cache current monolithic string): Would still get some cache hits but suboptimal prefix matching. Rejected.

## R-007: Alerting Mechanism

**Decision**: Implement threshold-based alerting using the existing Celery periodic task infrastructure. Alerts are logged and optionally sent via configurable webhook (Slack, email, etc.).

**Rationale**: The spec requires configurable alerts for per-conversation cost spikes, daily spend limits, and cache hit rate drops. Using Celery beat for periodic checks keeps the architecture simple. Webhook-based notification is extensible without coupling to a specific notification service.

**Key Implementation Details**:
- New config settings: `alert_conversation_cost_threshold`, `alert_daily_spend_threshold`, `alert_cache_hit_rate_minimum`, `alert_webhook_url`
- Celery beat task: runs every 5 minutes, checks thresholds against `token_usage` aggregates
- Alert record: logged to database + sent to webhook URL if configured
- Per-conversation alerts: checked inline after each API call (synchronous, low overhead)
- Daily/cache-rate alerts: checked by periodic task

**Alternatives Considered**:
- **External monitoring (Datadog, Grafana)**: More powerful but adds infrastructure dependency. Can be layered on top later. Rejected for MVP.
- **No alerting** (manual monitoring only): Doesn't meet spec requirement FR-011. Rejected.
