# API Contract: Chat Endpoints

**Date**: 2026-03-04 | **Feature**: [spec.md](../spec.md)

## Base URL

`/api/v1/chat`

---

## POST `/api/v1/chat/{story_id}/stream`

Send a message and receive a streaming persona response via SSE.

### Request

**Path Parameters**:
- `story_id` (UUID, required) — The story to discuss

**Body** (JSON):
```json
{
  "message": "Why do you think this policy matters?",
  "perspective": "left",
  "conversation_id": "uuid-or-null"
}
```

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| message | string | yes | User's message text (max 2000 chars) |
| perspective | string | yes | `"left"`, `"center"`, or `"right"` |
| conversation_id | string (UUID) or null | no | Existing conversation to continue; null starts new |

### Response

**Content-Type**: `text/event-stream`
**Headers**: `Cache-Control: no-cache`, `X-Accel-Buffering: no`

**SSE Event Types**:

#### `conversation_start` (first event, only for new conversations)
```json
data: {"type": "conversation_start", "conversation_id": "uuid"}
```

#### `token` (streamed text deltas)
```json
data: {"type": "token", "text": "The progressive perspective on this "}
```

#### `citation` (emitted after response complete, before done)
```json
data: {"type": "citation", "citations": [
  {
    "index": 1,
    "source_name": "The Guardian",
    "article_title": "Policy impact analysis shows...",
    "article_url": "https://...",
    "bias_label": "left",
    "quoted_text": "The policy has shown significant..."
  }
]}
```

#### `done` (stream complete)
```json
data: {"type": "done", "message_id": "uuid"}
```

#### `error` (on failure)
```json
data: {"type": "error", "code": "rate_limit", "message": "Too many requests"}
```

#### `ended` (conversation ended due to abuse)
```json
data: {"type": "ended", "reason": "abuse_threshold", "message": "This conversation has been ended..."}
```

### Error Responses (non-streaming)

| Status | Condition |
| ------ | --------- |
| 400 | Invalid perspective value, message too long, or empty message |
| 404 | Story not found |
| 409 | Conversation already ended (is_ended = true) |
| 422 | Invalid conversation_id format |
| 429 | Rate limited (max 10 messages/min per story) |
| 503 | LLM service unavailable |

---

## GET `/api/v1/chat/{story_id}/conversations`

List all conversations for a story.

### Request

**Path Parameters**:
- `story_id` (UUID, required)

### Response (200)

```json
{
  "conversations": [
    {
      "id": "uuid",
      "story_id": "uuid",
      "perspective": "left",
      "message_count": 12,
      "is_ended": false,
      "created_at": "2026-03-04T10:00:00Z",
      "updated_at": "2026-03-04T10:30:00Z",
      "last_message_preview": "The progressive argument centers on..."
    }
  ]
}
```

---

## GET `/api/v1/chat/conversations/{conversation_id}`

Get full conversation with all messages.

### Request

**Path Parameters**:
- `conversation_id` (UUID, required)

### Response (200)

```json
{
  "id": "uuid",
  "story_id": "uuid",
  "perspective": "left",
  "is_ended": false,
  "created_at": "2026-03-04T10:00:00Z",
  "updated_at": "2026-03-04T10:30:00Z",
  "messages": [
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hello! I'm an AI representing left-leaning perspectives on this story...",
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
      "created_at": "2026-03-04T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "user",
      "content": "Why do you think this policy matters?",
      "citations": null,
      "created_at": "2026-03-04T10:01:00Z"
    }
  ]
}
```

### Error Responses

| Status | Condition |
| ------ | --------- |
| 404 | Conversation not found |

---

## DELETE `/api/v1/chat/conversations/{conversation_id}`

Delete a conversation and all its messages.

### Request

**Path Parameters**:
- `conversation_id` (UUID, required)

### Response (204)

No content.

### Error Responses

| Status | Condition |
| ------ | --------- |
| 404 | Conversation not found |

---

## GET `/api/v1/chat/{story_id}/perspectives`

Check which perspectives are available for a story (have source articles).

### Request

**Path Parameters**:
- `story_id` (UUID, required)

### Response (200)

```json
{
  "perspectives": {
    "left": {"available": true, "source_count": 3},
    "center": {"available": true, "source_count": 5},
    "right": {"available": false, "source_count": 0}
  }
}
```

### Error Responses

| Status | Condition |
| ------ | --------- |
| 404 | Story not found |

---

## Rate Limiting

- Chat streaming: 10 messages per minute per story (keyed by IP + story_id)
- Conversation CRUD: 60 requests per minute per IP
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## SSE Connection Notes

- Client should send `Accept: text/event-stream` header
- Server keeps connection open until `done` or `error` event
- Client should close EventSource after receiving `done`
- No keepalive/heartbeat needed (responses complete within ~30s)
