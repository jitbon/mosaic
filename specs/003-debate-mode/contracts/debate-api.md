# API Contract: Debate Endpoints

**Date**: 2026-03-04 | **Feature**: [spec.md](../spec.md)

## Base URL

`/api/v1/debate`

---

## POST `/api/v1/debate/{story_id}/start`

Create a new debate for a story with selected personas.

### Request

**Path Parameters**:
- `story_id` (UUID, required) — The story to debate

**Body** (JSON):
```json
{
  "personas": ["left", "right"]
}
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| personas | string[] | yes | 2 or 3 perspectives: `"left"`, `"center"`, `"right"` |

### Response (201)

```json
{
  "id": "uuid",
  "story_id": "uuid",
  "personas": ["left", "right"],
  "status": "active",
  "current_round": 0,
  "created_at": "2026-03-04T10:00:00Z"
}
```

### Error Responses

| Status | Condition |
| ------ | --------- |
| 400 | Less than 2 or more than 3 personas, duplicate perspectives, or invalid perspective value |
| 404 | Story not found |
| 422 | Selected perspective has no source articles for this story |

---

## POST `/api/v1/debate/{debate_id}/round`

Stream the next round of debate turns. Each persona speaks once per round in rotation order.

### Request

**Path Parameters**:
- `debate_id` (UUID, required) — The debate to continue

**Body**: None (empty or `{}`)

### Response

**Content-Type**: `text/event-stream`
**Headers**: `Cache-Control: no-cache`, `X-Accel-Buffering: no`

**SSE Event Types**:

#### `round_start`
```json
data: {"type": "round_start", "round_number": 1}
```

#### `turn_start` (before each persona's turn)
```json
data: {"type": "turn_start", "role": "persona_left", "turn_number": 0}
```

#### `token` (streamed text deltas)
```json
data: {"type": "token", "text": "From a progressive standpoint, "}
```

#### `citation` (emitted after each turn's text, before turn_summary)
```json
data: {"type": "citation", "citations": [
  {
    "index": 1,
    "source_name": "The Guardian",
    "article_title": "Economic policy analysis...",
    "article_url": "https://...",
    "bias_label": "left",
    "quoted_text": "The data shows..."
  }
]}
```

#### `turn_summary` (collapsed summary for the completed turn)
```json
data: {"type": "turn_summary", "turn_id": "uuid", "summary": "Argues that the policy benefits middle-class workers based on Guardian and NYT analysis."}
```

#### `turn_complete`
```json
data: {"type": "turn_complete", "turn_id": "uuid", "role": "persona_left"}
```

#### `round_complete`
```json
data: {"type": "round_complete", "round_number": 1, "debate_id": "uuid"}
```

#### `error`
```json
data: {"type": "error", "code": "rate_limit", "message": "Too many requests"}
```

#### `ended` (debate ended due to abuse or completion)
```json
data: {"type": "ended", "reason": "abuse_threshold", "message": "This debate has been ended..."}
```

### Error Responses (non-streaming)

| Status | Condition |
| ------ | --------- |
| 404 | Debate not found |
| 409 | Debate already completed or ended |
| 429 | Rate limited (max 5 rounds/min per debate) |
| 503 | LLM service unavailable |

---

## POST `/api/v1/debate/{debate_id}/interject`

Submit a moderator interjection during or between rounds.

### Request

**Path Parameters**:
- `debate_id` (UUID, required)

**Body** (JSON):
```json
{
  "message": "Can you both address the impact on small businesses?",
  "directed_at": null
}
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| message | string | yes | User's interjection text (max 2000 chars) |
| directed_at | string or null | no | Specific perspective to address (`"left"`, `"center"`, `"right"`), or null for all |

### Response (201)

```json
{
  "turn_id": "uuid",
  "turn_number": 5,
  "role": "moderator",
  "content": "Can you both address the impact on small businesses?",
  "directed_at": null
}
```

### Error Responses

| Status | Condition |
| ------ | --------- |
| 400 | Empty message or message too long |
| 404 | Debate not found |
| 409 | Debate already completed or ended |

---

## GET `/api/v1/debate/{story_id}/debates`

List all debates for a story.

### Request

**Path Parameters**:
- `story_id` (UUID, required)

### Response (200)

```json
{
  "debates": [
    {
      "id": "uuid",
      "story_id": "uuid",
      "personas": ["left", "right"],
      "status": "active",
      "current_round": 3,
      "turn_count": 8,
      "created_at": "2026-03-04T10:00:00Z",
      "updated_at": "2026-03-04T10:30:00Z",
      "last_turn_preview": "The conservative perspective emphasizes..."
    }
  ]
}
```

---

## GET `/api/v1/debate/{debate_id}`

Get full debate with all turns.

### Request

**Path Parameters**:
- `debate_id` (UUID, required)

### Response (200)

```json
{
  "id": "uuid",
  "story_id": "uuid",
  "personas": ["left", "right"],
  "status": "active",
  "current_round": 2,
  "created_at": "2026-03-04T10:00:00Z",
  "updated_at": "2026-03-04T10:15:00Z",
  "turns": [
    {
      "id": "uuid",
      "turn_number": 0,
      "role": "persona_left",
      "content": "From a progressive standpoint, this policy represents...",
      "summary": "Argues the policy advances economic equity based on Guardian analysis.",
      "citations": [
        {
          "index": 1,
          "source_name": "The Guardian",
          "article_title": "...",
          "article_url": "https://...",
          "bias_label": "left",
          "quoted_text": "..."
        }
      ],
      "round_number": 1,
      "created_at": "2026-03-04T10:00:00Z"
    },
    {
      "id": "uuid",
      "turn_number": 1,
      "role": "persona_right",
      "content": "While my colleague raises valid concerns about equity...",
      "summary": "Counters that the policy's costs outweigh benefits, citing WSJ data.",
      "citations": [...],
      "round_number": 1,
      "created_at": "2026-03-04T10:00:30Z"
    },
    {
      "id": "uuid",
      "turn_number": 2,
      "role": "moderator",
      "content": "Can you both address the impact on small businesses?",
      "summary": null,
      "citations": null,
      "round_number": 1,
      "created_at": "2026-03-04T10:01:00Z"
    }
  ]
}
```

### Error Responses

| Status | Condition |
| ------ | --------- |
| 404 | Debate not found |

---

## DELETE `/api/v1/debate/{debate_id}`

Delete a debate and all its turns.

### Request

**Path Parameters**:
- `debate_id` (UUID, required)

### Response (204)

No content.

### Error Responses

| Status | Condition |
| ------ | --------- |
| 404 | Debate not found |

---

## Rate Limiting

- Debate rounds: 5 rounds per minute per debate (keyed by IP + debate_id)
- Interjections: 10 per minute per debate
- Debate CRUD: 60 requests per minute per IP
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## SSE Connection Notes

- Client should send `Accept: text/event-stream` header
- Server keeps connection open for entire round (multiple turns)
- A round may take 30-90s depending on number of personas
- Client should close EventSource after receiving `round_complete` or `ended`
- No keepalive needed (continuous streaming within round)
