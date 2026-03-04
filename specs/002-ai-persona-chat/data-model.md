# Data Model: AI Persona Chat

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Entities

### ArticleChunk (NEW — Backend + Database)

Stores chunked and embedded article content for RAG retrieval.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique chunk identifier |
| article_id | UUID | FK → articles.id, NOT NULL | Parent article |
| story_id | UUID | FK → stories.id, NOT NULL, indexed | Parent story (denormalized for query performance) |
| bias_label | TEXT | NOT NULL, CHECK (left, center-left, center, center-right, right) | Source bias rating (copied from source at chunk time) |
| chunk_index | INT | NOT NULL | Position within article (0-based) |
| content | TEXT | NOT NULL | Chunk text (~300-400 tokens) |
| embedding | VECTOR(1536) | NOT NULL, IVFFlat index | OpenAI text-embedding-3-small embedding |
| metadata | JSONB | NOT NULL | `{source_name, article_title, article_url, published_at}` |
| created_at | TIMESTAMP | NOT NULL, default now() | When chunk was created |

**Indexes**:
- `article_chunks_story_id_idx` on `story_id`
- `article_chunks_embedding_idx` IVFFlat on `embedding` with `vector_cosine_ops` (lists=100)
- `article_chunks_story_bias_idx` on `(story_id, bias_label)`

**Relationships**: Many-to-one with Article, Many-to-one with Story

---

### Conversation (NEW — Backend Database)

Represents a chat thread between a user and a specific persona about a specific story.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique conversation identifier |
| story_id | UUID | FK → stories.id, NOT NULL | Story being discussed |
| perspective | TEXT | NOT NULL, CHECK (left, center, right) | Persona perspective |
| created_at | TIMESTAMP | NOT NULL, default now() | When conversation started |
| updated_at | TIMESTAMP | NOT NULL, default now(), auto-update | Last activity timestamp |
| abuse_redirect_count | INT | NOT NULL, default 0 | Consecutive abuse redirections (resets on non-abusive message) |
| is_ended | BOOLEAN | NOT NULL, default false | True if ended due to abuse threshold |
| context_summary | TEXT | NULL | Summarized earlier messages when context exceeds limit |

**Indexes**:
- `conversations_story_perspective_idx` on `(story_id, perspective)`
- `conversations_updated_at_idx` on `updated_at` (for expiry queries)

**Unique constraint**: `(story_id, perspective)` — one active conversation per perspective per story

**Relationships**: Many-to-one with Story, One-to-many with Message

---

### Message (NEW — Backend Database)

Represents a single exchange in a conversation.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique message identifier |
| conversation_id | UUID | FK → conversations.id, NOT NULL, ON DELETE CASCADE | Parent conversation |
| role | TEXT | NOT NULL, CHECK (user, assistant) | Who sent the message |
| content | TEXT | NOT NULL | Message text content |
| citations | JSONB | NULL | Array of `{chunk_id, source_name, article_title, article_url, bias_label, quoted_text}` |
| created_at | TIMESTAMP | NOT NULL, default now() | When message was sent |

**Indexes**:
- `messages_conversation_id_idx` on `conversation_id`
- `messages_created_at_idx` on `(conversation_id, created_at)`

**Relationships**: Many-to-one with Conversation

---

## Mobile Local Schema (expo-sqlite)

### conversations (local)

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | TEXT | PK, matches server UUID |
| story_id | TEXT | Story reference |
| perspective | TEXT | left, center, right |
| story_headline | TEXT | Cached for display in history list |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp (for 30-day expiry) |

### messages (local)

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | TEXT | PK, matches server UUID |
| conversation_id | TEXT | FK → conversations.id |
| role | TEXT | user or assistant |
| content | TEXT | Message text |
| citations_json | TEXT | JSON string of citation array |
| created_at | TEXT | ISO timestamp |

**Expiry**: On app launch, delete rows where `conversations.updated_at < now - 30 days`.

---

## State Transitions

### Conversation Lifecycle

```
[Created] → [Active] → [Ended (abuse)] or [Expired (30 days)]
                ↑
                └── [Resumed] (user returns to story)
```

- **Created**: First message sent for this story + perspective
- **Active**: User and persona exchanging messages; `abuse_redirect_count` may increment
- **Ended**: `abuse_redirect_count >= 3` → `is_ended = true`, no further messages accepted
- **Expired**: `updated_at` older than 30 days → deleted on cleanup
- **Resumed**: User returns; if not ended/expired, conversation continues with history

### Abuse Counter

```
User sends message → Check for abusive content
  ├── Not abusive → Reset abuse_redirect_count to 0, proceed normally
  └── Abusive → Increment abuse_redirect_count
       ├── Count < 3 → Persona redirects to substantive discussion
       └── Count >= 3 → Set is_ended = true, return end-conversation message
```

---

## Entity Relationship Diagram

```
Story (existing)
  ├── 1:N → Article (existing)
  │           └── 1:N → ArticleChunk (NEW)
  └── 1:N → Conversation (NEW)
               └── 1:N → Message (NEW)

Source (existing)
  └── 1:N → Article (existing)
               └── bias_rating copied to → ArticleChunk.bias_label
```
