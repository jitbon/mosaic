# Data Model: User Accounts & Authentication

**Feature**: 006-user-accounts
**Date**: 2026-03-22

---

## Overview

This feature introduces 4 new application-level tables and modifies 3 existing tables. Supabase manages the `auth.users` table independently — the application-level `app_users` table mirrors the Supabase `sub` UUID as its primary key.

---

## New Tables

### `app_users`

Application-level user profile. Keyed on the same UUID as `auth.users.id` (Supabase).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, NOT NULL | Mirrors `auth.users.id`; set by application on first login |
| `display_name` | `VARCHAR(100)` | NOT NULL | User-chosen name; shown in UI |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Copied from Supabase auth on account creation; updated on email change |
| `account_status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'active'` | Enum: `active`, `pending_deletion`, `deleted` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Account creation timestamp |
| `last_login_at` | `TIMESTAMPTZ` | NULLABLE | Updated on each successful login |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Set when deletion is requested; hard delete after 30 days |

**Indexes**:
- `UNIQUE (email)`
- `INDEX (account_status)` — for deletion batch jobs
- `INDEX (deleted_at)` — for 30-day cleanup job

**State transitions**:
```
[registration] → active
active → pending_deletion (user requests delete)
pending_deletion → deleted (30-day job runs hard delete)
```

---

### `user_preferences`

One-to-one with `app_users`. Stores personalization settings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `INTEGER` | PK, AUTOINCREMENT | |
| `user_id` | `UUID` | FK → `app_users.id` ON DELETE CASCADE, UNIQUE | One row per user |
| `default_perspective` | `VARCHAR(20)` | NULLABLE | e.g. `'left'`, `'center'`, `'right'` |
| `notification_prefs` | `JSONB` | NOT NULL, DEFAULT `'{}'` | Extensible notification settings |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Updated on each change |

**Indexes**:
- `UNIQUE (user_id)`

---

### `social_accounts`

OAuth provider links. A user may have multiple social accounts linked.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `INTEGER` | PK, AUTOINCREMENT | |
| `user_id` | `UUID` | FK → `app_users.id` ON DELETE CASCADE, NOT NULL | |
| `provider` | `VARCHAR(20)` | NOT NULL | Enum: `google`, `apple`, `facebook` |
| `provider_user_id` | `VARCHAR(255)` | NOT NULL | Provider's unique user ID |
| `provider_email` | `VARCHAR(255)` | NULLABLE | May be a relay address for Apple |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | |

**Indexes**:
- `UNIQUE (provider, provider_user_id)` — prevents duplicate links
- `INDEX (user_id)` — for listing linked accounts on profile page

**Constraints**:
- A given `(provider, provider_user_id)` pair maps to exactly one `app_users` row
- `provider_email` may differ from `app_users.email` (Apple private relay)

---

### `guest_sessions`

Tracks anonymous (guest) session state. Keyed on the Supabase anonymous `sub` UUID.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `UUID` | PK | Supabase anon `sub` from JWT |
| `conversation_count` | `INTEGER` | NOT NULL, DEFAULT `0` | Incremented on each conversation start; max 5 |
| `first_seen_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | |
| `converted_at` | `TIMESTAMPTZ` | NULLABLE | Set when guest upgrades to full account |

**No FK to `app_users`** — guest rows exist independently. When a guest registers, `converted_at` is set and a new `app_users` row is created with the same UUID.

---

## Modified Tables

### `conversations` (existing)

Add a nullable `user_id` FK to link conversations to registered users.

| Column | Change | Notes |
|--------|--------|-------|
| `user_id` | **ADD** `UUID NULLABLE FK → app_users.id ON DELETE SET NULL` | NULL for pre-migration anonymous rows; set on registration migration |

**Migration note**: All existing rows will have `user_id = NULL`. After a guest registers, their anonymous conversations are updated to set `user_id`.

**New index**: `INDEX (user_id)` — for fetching a user's conversation history.

---

### `debates` (existing)

Add a nullable `user_id` FK to link debates to registered users.

| Column | Change | Notes |
|--------|--------|-------|
| `user_id` | **ADD** `UUID NULLABLE FK → app_users.id ON DELETE SET NULL` | Same pattern as `conversations` |

**New index**: `INDEX (user_id)`.

---

### `debate_turns` (existing)

Add `display_name` (denormalized snapshot) and nullable `user_id` FK.

| Column | Change | Notes |
|--------|--------|-------|
| `user_id` | **ADD** `UUID NULLABLE FK → app_users.id ON DELETE SET NULL` | NULL for AI-generated turns; set for future human-in-debate turns |
| `display_name` | **ADD** `VARCHAR(100) NOT NULL DEFAULT 'AI'` | Snapshot of user's display name at time of turn; updated to `"Deleted User"` on account deletion |

**Note**: Currently all debate turns are AI-generated. The `user_id` and `display_name` fields are forward-compatible for future human participation. For now, `user_id = NULL` and `display_name = 'AI'` for all existing rows.

---

## Entity Relationships

```
auth.users (Supabase-managed)
    │  1:1
    ▼
app_users ──────────────────────────────────────────────┐
    │ 1:1                │ 1:N                │ 1:N      │ 1:N (nullable)
    ▼                    ▼                    ▼          ▼
user_preferences   social_accounts      conversations  debates
                                              │               │
                                              ▼               ▼
                                           messages      debate_turns
                                                         (display_name snapshot)

guest_sessions (no FK to app_users — anonymous users only)
    │ 1:N (nullable, via user_id)
    ▼
conversations (user_id = anon UUID while guest; updated to app_users.id on registration)
```

---

## Alembic Migration

Single migration file: `xxxx_add_user_accounts.py`

Operations in order:
1. Create `app_users` table
2. Create `user_preferences` table
3. Create `social_accounts` table
4. Create `guest_sessions` table
5. Add `user_id` column to `conversations` (nullable, FK, SET NULL)
6. Add `user_id` column to `debates` (nullable, FK, SET NULL)
7. Add `user_id` and `display_name` columns to `debate_turns`
8. Create all indexes

**Rollback**: Drop all new columns and tables in reverse order. All new columns are nullable so rollback does not affect existing data.

---

## Validation Rules (from spec FR-002)

- `email`: valid RFC 5322 format + uniqueness check against `app_users.email`
- `display_name`: 1–100 characters, non-empty after stripping whitespace
- `password`: minimum 8 characters, at least one uppercase letter and one digit (enforced by Supabase Auth)
- `provider`: must be one of `google`, `apple`, `facebook`
- `guest_sessions.conversation_count`: reject increment if current value ≥ 5; return HTTP 403 with `{"code": "GUEST_LIMIT_REACHED"}`

---

## Data Export Scope (FR-010a)

The user data export ZIP includes:

```
my-data.zip
├── profile.json          # app_users + user_preferences fields
├── conversations.json    # all conversations + messages where user_id = <uid>
└── debates.json          # all debates + debate_turns where debate.user_id = <uid>
```

Fields excluded from export: `deleted_at`, `account_status` (internal), hashed passwords (Supabase-managed, not accessible).
