# API Contract: Token Usage & Reporting

**Feature Branch**: `005-token-efficiency`
**Date**: 2026-03-22

## Endpoints

### GET /api/v1/admin/usage

Returns aggregated token usage and cost data.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start_date | ISO 8601 date | No | 7 days ago | Start of reporting period |
| end_date | ISO 8601 date | No | today | End of reporting period |
| feature_type | string | No | all | Filter: `chat`, `debate`, `summarization`, `precompute`, or `all` |
| group_by | string | No | `day` | Grouping: `day`, `hour`, `story`, `conversation` |
| story_id | integer | No | — | Filter to a specific story |

**Response** (200 OK):

```json
{
  "period": {
    "start": "2026-03-15",
    "end": "2026-03-22"
  },
  "totals": {
    "input_tokens": 1250000,
    "output_tokens": 340000,
    "cache_creation_tokens": 180000,
    "cache_read_tokens": 890000,
    "estimated_cost_usd": 4.72,
    "request_count": 3200,
    "cache_hit_rate": 0.68
  },
  "breakdown": [
    {
      "group_key": "2026-03-15",
      "feature_type": "chat",
      "input_tokens": 180000,
      "output_tokens": 48000,
      "cache_creation_tokens": 25000,
      "cache_read_tokens": 120000,
      "estimated_cost_usd": 0.67,
      "request_count": 450,
      "cache_hit_rate": 0.72
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid date format or parameter values
- `401`: Unauthorized (no admin credentials)

---

### GET /api/v1/admin/usage/alerts

Returns recent alert events.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| since | ISO 8601 datetime | No | 24 hours ago | Return alerts after this time |
| alert_type | string | No | all | Filter: `conversation_cost`, `daily_spend`, `cache_rate` |

**Response** (200 OK):

```json
{
  "alerts": [
    {
      "id": 42,
      "alert_type": "conversation_cost",
      "message": "Conversation 1234 exceeded cost threshold: $0.82 (limit: $0.50)",
      "threshold_value": 0.50,
      "actual_value": 0.82,
      "story_id": 56,
      "conversation_id": 1234,
      "created_at": "2026-03-22T14:30:00Z"
    }
  ]
}
```

---

### GET /api/v1/admin/usage/cache-stats

Returns prompt cache performance metrics.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | string | No | `24h` | Time window: `1h`, `24h`, `7d`, `30d` |

**Response** (200 OK):

```json
{
  "period": "24h",
  "total_requests": 850,
  "cache_hits": 612,
  "cache_misses": 238,
  "hit_rate": 0.72,
  "tokens_saved": 489600,
  "estimated_savings_usd": 3.52,
  "by_feature": {
    "chat": { "hit_rate": 0.75, "requests": 620 },
    "debate": { "hit_rate": 0.63, "requests": 180 },
    "summarization": { "hit_rate": 0.0, "requests": 50 }
  }
}
```

---

## Internal Contracts (No New External API Surface)

### Prompt Caching (Internal)

The existing streaming endpoints (`POST /api/v1/chat/{story_id}/stream` and `POST /api/v1/debate/{debate_id}/round`) are unchanged externally. The prompt caching optimization is transparent to clients.

**New SSE event type** added to existing streams:

```json
{"type": "usage", "input_tokens": 1200, "output_tokens": 340, "cache_read_tokens": 900, "estimated_cost_usd": 0.002}
```

This event is emitted after the `done` event in the SSE stream, providing per-request usage info to the frontend for optional display.

### Pre-computed Summary Trigger (Internal)

**POST /api/v1/admin/stories/{story_id}/precompute** (admin-only)

Manually triggers pre-computation of perspective summaries for a story.

**Response** (202 Accepted):

```json
{
  "message": "Pre-computation queued",
  "story_id": 56,
  "perspectives": ["left", "center", "right"]
}
```
