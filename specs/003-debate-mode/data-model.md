# Data Model: Multi-Persona Debate Mode

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Entities

### Debate (NEW — Backend + Database)

Represents a structured multi-persona exchange about a specific story.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique debate identifier |
| story_id | UUID | FK → stories.id, NOT NULL, indexed | Story being debated |
| personas | JSONB | NOT NULL | Array of perspectives, e.g. `["left", "right"]` or `["left", "center", "right"]` |
| status | TEXT | NOT NULL, CHECK (active, paused, completed), default 'active' | Current debate state |
| current_round | INT | NOT NULL, default 0 | Number of completed rounds |
| abuse_redirect_count | INT | NOT NULL, default 0 | Consecutive abuse redirections (resets on non-abusive interjection) |
| context_summary | TEXT | NULL | Summarized earlier turns when context exceeds limit |
| created_at | TIMESTAMP | NOT NULL, default now() | When debate started |
| updated_at | TIMESTAMP | NOT NULL, default now(), auto-update | Last activity timestamp |

**Indexes**:
- `debates_story_id_idx` on `story_id`
- `debates_updated_at_idx` on `updated_at` (for expiry queries)

**Relationships**: Many-to-one with Story, One-to-many with DebateTurn

---

### DebateTurn (NEW — Backend + Database)

Represents a single contribution in the debate — either a persona turn or a moderator interjection.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique turn identifier |
| debate_id | UUID | FK → debates.id, NOT NULL, ON DELETE CASCADE | Parent debate |
| turn_number | INT | NOT NULL | Sequential position in debate (0-based) |
| role | TEXT | NOT NULL, CHECK (persona_left, persona_center, persona_right, moderator) | Who contributed this turn |
| content | TEXT | NOT NULL | Full response text |
| summary | TEXT | NULL | 1-2 sentence summary for collapsed view (NULL for moderator turns) |
| citations | JSONB | NULL | Array of `{index, source_name, article_title, article_url, bias_label, quoted_text}` (NULL for moderator turns) |
| round_number | INT | NOT NULL | Which debate round this turn belongs to |
| created_at | TIMESTAMP | NOT NULL, default now() | When turn was created |

**Indexes**:
- `debate_turns_debate_id_idx` on `debate_id`
- `debate_turns_debate_turn_idx` on `(debate_id, turn_number)` UNIQUE

**Relationships**: Many-to-one with Debate

---

## Mobile Local Schema (expo-sqlite)

### debates (local)

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | TEXT | PK, matches server UUID |
| story_id | TEXT | Story reference |
| story_headline | TEXT | Cached for display in debate history |
| personas | TEXT | JSON array of perspectives |
| status | TEXT | active, paused, completed |
| current_round | INTEGER | Completed rounds count |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp (for 30-day expiry) |

### debate_turns (local)

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | TEXT | PK, matches server UUID |
| debate_id | TEXT | FK → debates.id |
| turn_number | INTEGER | Sequential position |
| role | TEXT | persona_left, persona_center, persona_right, moderator |
| content | TEXT | Full response text |
| summary | TEXT | Collapsed summary (NULL for moderator) |
| citations_json | TEXT | JSON string of citation array |
| round_number | INTEGER | Debate round |
| created_at | TEXT | ISO timestamp |

**Expiry**: On app launch, delete rows where `debates.updated_at < now - 30 days`.

---

## State Transitions

### Debate Lifecycle

```
[Created] → [Active] → [Paused] → [Resumed → Active]
                ↓              ↓
          [Completed]    [Expired (30 days)]
```

- **Created**: Debate started, personas selected, first round initiated
- **Active**: Rounds in progress; personas generating turns or waiting for next round/interjection
- **Paused**: User navigated away mid-debate; can resume later
- **Completed**: User or system ended the debate (natural conclusion or abuse threshold)
- **Expired**: `updated_at` older than 30 days → deleted on cleanup
- **Resumed**: User returns to a paused debate; context rebuilt from stored turns

### Round Flow

```
Round Start
  → Persona A streams turn → turn_summary → turn_complete
  → Persona B streams turn → turn_summary → turn_complete
  → [Persona C if 3-way] → turn_summary → turn_complete
  → round_complete
  → User can: interject OR request next round OR end debate
```

### Abuse Counter

```
User sends interjection → Check for abusive content
  ├── Not abusive → Reset abuse_redirect_count to 0, include in next turn context
  └── Abusive → Increment abuse_redirect_count
       ├── Count < 3 → Next persona redirects to substantive discussion
       └── Count >= 3 → Set status = 'completed', return end-debate message
```

---

## Entity Relationship Diagram

```
Story (existing)
  ├── 1:N → Article (existing)
  │           └── 1:N → ArticleChunk (existing, from feature 002)
  ├── 1:N → Conversation (existing, from feature 002)
  │           └── 1:N → Message (existing, from feature 002)
  └── 1:N → Debate (NEW)
               └── 1:N → DebateTurn (NEW, includes moderator interjections)
```
