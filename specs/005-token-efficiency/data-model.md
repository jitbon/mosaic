# Data Model: API Token Efficiency & Prompt Optimization

**Feature Branch**: `005-token-efficiency`
**Date**: 2026-03-22

## New Entities

### TokenUsage

Tracks token consumption for every AI provider API call.

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | Integer | PK, auto-increment | Unique identifier |
| feature_type | String(20) | NOT NULL, indexed | One of: `chat`, `debate`, `summarization`, `precompute` |
| model_name | String(50) | NOT NULL | Model used (e.g., `claude-haiku-4-5-20251001`) |
| story_id | Integer | FK → stories.id, nullable, indexed | Associated story (null for non-story calls) |
| conversation_id | Integer | FK → conversations.id, nullable | Associated conversation (chat calls) |
| debate_id | Integer | FK → debates.id, nullable | Associated debate (debate calls) |
| input_tokens | Integer | NOT NULL | Total input tokens (from API response) |
| output_tokens | Integer | NOT NULL | Total output tokens (from API response) |
| cache_creation_tokens | Integer | NOT NULL, default=0 | Tokens written to cache |
| cache_read_tokens | Integer | NOT NULL, default=0 | Tokens read from cache |
| estimated_cost_usd | Float | NOT NULL | Estimated cost in USD |
| created_at | DateTime(tz) | NOT NULL, default=now, indexed | Timestamp of the API call |

**Indexes**: `(feature_type)`, `(story_id)`, `(created_at)`, `(feature_type, created_at)`

**Retention**: Detailed records kept 90 days. Aggregated into `TokenUsageDaily` after 90 days.

---

### TokenUsageDaily

Aggregated daily summaries for long-term trend analysis.

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | Integer | PK, auto-increment | Unique identifier |
| date | Date | NOT NULL, indexed | Aggregation date |
| feature_type | String(20) | NOT NULL | chat, debate, summarization, precompute |
| total_input_tokens | BigInteger | NOT NULL | Sum of input tokens for the day |
| total_output_tokens | BigInteger | NOT NULL | Sum of output tokens for the day |
| total_cache_creation_tokens | BigInteger | NOT NULL | Sum of cache creation tokens |
| total_cache_read_tokens | BigInteger | NOT NULL | Sum of cache read tokens |
| total_estimated_cost_usd | Float | NOT NULL | Sum of estimated costs |
| request_count | Integer | NOT NULL | Number of API calls |
| cache_hit_count | Integer | NOT NULL | Number of calls with cache_read_tokens > 0 |

**Indexes**: `(date, feature_type)` UNIQUE

**Retention**: Kept indefinitely.

---

### StorySummary

Pre-computed perspective summaries for popular/flagged stories.

| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | Integer | PK, auto-increment | Unique identifier |
| story_id | Integer | FK → stories.id, cascade delete, indexed | Associated story |
| perspective | String(20) | NOT NULL | left, center, right |
| summary_text | Text | NOT NULL | Condensed perspective summary |
| source_article_ids | JSONB | NOT NULL | List of article IDs used to generate |
| source_version_hash | String(64) | NOT NULL | SHA-256 of source chunk content for staleness detection |
| token_count | Integer | NOT NULL | Token count of the summary_text |
| created_at | DateTime(tz) | NOT NULL, default=now | Generation timestamp |
| expires_at | DateTime(tz) | NOT NULL | TTL expiration (default: created_at + 24h) |

**Indexes**: `(story_id, perspective)` UNIQUE, `(expires_at)`

**Retention**: Expired summaries cleaned up by periodic task.

---

## Modified Entities

### Conversation (existing)

No schema changes. Existing `context_summary` column is reused for rolling summaries.

### Debate (existing)

No schema changes. Existing `context_summary` column is reused for rolling summaries.

---

## New Configuration Settings (config.py additions)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `token_budget_chat` | int | 4000 | Max input tokens per chat request |
| `token_budget_debate` | int | 6000 | Max input tokens per debate request |
| `context_window_recent_messages` | int | 6 | Number of recent messages kept verbatim |
| `summary_precompute_threshold` | int | 5 | Conversations started before pre-computing summaries |
| `summary_precompute_ttl_hours` | int | 24 | TTL for pre-computed summaries |
| `model_cost_input_per_million` | float | 0.80 | Input token cost ($/1M tokens) |
| `model_cost_output_per_million` | float | 4.00 | Output token cost ($/1M tokens) |
| `model_cost_cache_read_per_million` | float | 0.08 | Cache read cost ($/1M tokens) |
| `model_cost_cache_write_per_million` | float | 1.00 | Cache write cost ($/1M tokens) |
| `alert_conversation_cost_threshold` | float | 0.50 | Alert if single conversation costs > $X |
| `alert_daily_spend_threshold` | float | 50.00 | Alert if daily spend exceeds $X |
| `alert_cache_hit_rate_minimum` | float | 0.40 | Alert if cache hit rate drops below X% |
| `alert_webhook_url` | str | "" | Webhook URL for alert notifications (empty = log only) |
| `usage_retention_days` | int | 90 | Days to keep detailed usage records |

---

## Entity Relationships

```text
stories (existing)
├── 1:N → conversations (existing)
│         └── 1:N → messages (existing)
├── 1:N → debates (existing)
│         └── 1:N → debate_turns (existing)
├── 1:N → story_summaries (NEW) [per perspective]
├── 1:N → token_usage (NEW) [via story_id]
│
token_usage (NEW)
├── N:1 → stories (via story_id, nullable)
├── N:1 → conversations (via conversation_id, nullable)
├── N:1 → debates (via debate_id, nullable)
│
token_usage_daily (NEW)
└── (standalone aggregate, no FK relationships)
```

## Alembic Migrations

- **005_token_usage_table.py**: Creates `token_usage` and `token_usage_daily` tables
- **006_story_summaries_table.py**: Creates `story_summaries` table
