# Implementation Plan: User Accounts & Authentication

**Branch**: `006-user-accounts` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-user-accounts/spec.md`

---

## Summary

Add persistent user accounts to Mosaic by integrating Supabase Auth (already in the stack) across the FastAPI backend and Next.js web frontend. The feature delivers email/password registration, Google + Apple + Facebook social login, anonymous guest sessions (with a 5-chat limit), user profiles with data export and deletion, and migration of anonymous history to new accounts. The backend adds JWT verification middleware, a users/guest_sessions data model, auth endpoints, and a soft-delete anonymization pipeline. The frontend adds login/signup pages, an auth callback route, protected route middleware, and a profile page.

---

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x / Node.js 22 LTS (web frontend)
**Primary Dependencies**:
- Backend: FastAPI 0.128.8, SQLAlchemy 2.0.48, Alembic 1.16.5, `python-jose[cryptography]==3.3.0` (new), `slowapi>=0.1.9` (new), Celery 5.6.2 + Redis 7.0.1 (existing)
- Frontend: Next.js 15 (App Router), `@supabase/supabase-js@^2.45.0` (new), `@supabase/ssr@^0.5.0` (new)
**Storage**: PostgreSQL via Supabase (backend models), Supabase Auth (`auth.users` table managed by Supabase)
**Testing**: pytest (backend), Vitest + Playwright (frontend — existing)
**Target Platform**: Web (Next.js), Linux server (FastAPI)
**Performance Goals**: Login ≤ 2s p95 (SC-002), social login ≤ 10s (SC-006), registration flow ≤ 3 min end-to-end (SC-001)
**Constraints**: Access tokens expire in 1 hour (Supabase default); silent refresh via `middleware.ts`; guest sessions are ephemeral (storage-cleared = new identity)
**Scale/Scope**: MVP target 1000 concurrent users (constitution); guest session limit enforced per Supabase anonymous `sub` UUID

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Understanding Over Persuasion | ✅ Pass | Auth is infrastructure; no persona/persuasion logic involved |
| II. Steel-Manning Requirement | ✅ Pass | Not applicable — no AI persona content in this feature |
| III. Source Grounding | ✅ Pass | Not applicable — no RAG or persona claims |
| IV. Bias Transparency | ✅ Pass | Not applicable to auth flows |
| V. Privacy & Data Minimization | ✅ Pass | User data collected is minimal (email, display name, preferences); explicit consent for history; no political profiling; data export + deletion flow satisfies GDPR |
| VI. Moderation & Safety | ✅ Pass | Rate limiting on auth endpoints (FR-016); guest chat limit prevents abuse |
| AI Ethics (no false personification) | ✅ Pass | Not applicable |
| Performance & Reliability | ✅ Pass | SC-002 (login ≤ 2s), SC-004 (silent token refresh for 7-day sessions) align with constitution's 2s feed load target |
| Tech Stack Commitments | ✅ Pass | Next.js (web), FastAPI (backend), Supabase (auth + DB), all existing |
| App Store Requirements | ✅ Pass | In-app delete (Apple required since 2022, Google since 2023), data export endpoint added |

**Post-design re-check**: No violations introduced by data model or contracts. Constitution gates remain clear.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-user-accounts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.md
│   └── web-routes.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
backend/
├── src/
│   ├── api/v1/
│   │   ├── auth.py          # NEW: register, login proxy, refresh, logout, export, delete
│   │   ├── profile.py       # NEW: GET/PATCH profile, preferences
│   │   └── (existing: chat.py, debate.py, feed.py, story.py, admin.py)
│   ├── core/
│   │   ├── auth.py          # NEW: JWT verification dependency (get_current_user, get_optional_user)
│   │   └── (existing: config.py, database.py)
│   ├── models/
│   │   ├── user.py          # NEW: User, UserPreference, SocialAccount
│   │   ├── guest_session.py # NEW: GuestSession (anonymous sub + conversation count)
│   │   ├── conversation.py  # MODIFY: add nullable user_id FK
│   │   ├── debate.py        # MODIFY: add nullable user_id FK
│   │   └── debate_turn.py   # MODIFY: add display_name field, nullable user_id FK
│   ├── schemas/
│   │   ├── auth.py          # NEW: RegisterRequest, TokenResponse, ProfileResponse, etc.
│   │   └── user.py          # NEW: UserOut, UserPreferenceOut, UpdateProfileRequest
│   └── services/
│       ├── auth/            # NEW directory
│       │   ├── __init__.py
│       │   ├── supabase_client.py  # Supabase admin client (service_role key)
│       │   ├── user_service.py     # create_user, get_user, link_social, migrate_anonymous
│       │   ├── export_service.py   # generate_user_data_zip
│       │   └── deletion_service.py # anonymize_debates, delete_account
│       └── (existing: chat/, debate/, feed/, etc.)
├── alembic/versions/
│   └── xxxx_add_user_accounts.py  # NEW migration

web/
├── app/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts     # NEW: PKCE code exchange (OAuth + email verify + password reset)
│   │   ├── login/
│   │   │   └── page.tsx     # NEW: login form + social buttons + guest link
│   │   ├── signup/
│   │   │   └── page.tsx     # NEW: registration form
│   │   └── reset-password/
│   │       └── page.tsx     # NEW: password reset form (post-link)
│   ├── profile/
│   │   └── page.tsx         # NEW: view/edit profile, export data, delete account
│   └── (existing: chat/, debate/, history/, story/, page.tsx, layout.tsx)
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # NEW: createBrowserClient
│   │   └── server.ts        # NEW: createServerClient (for RSC and Route Handlers)
│   └── (existing: api.ts, sse.ts, theme.ts)
├── middleware.ts             # NEW: session refresh + route protection
└── (existing config files)
```

**Structure Decision**: Option 2 (web application) with existing `backend/` and `web/` directories. New code is additive — no restructuring of existing modules.

---

## Complexity Tracking

No constitution violations. No complexity justification required.

---

## Phase 0: Research

**Status**: ✅ Complete — see [research.md](research.md)

All NEEDS CLARIFICATION items resolved:
- Auth provider: Supabase Auth (existing in stack)
- JWT verification: `python-jose[cryptography]==3.3.0`
- Guest sessions: Supabase anonymous sign-in + `guest_sessions` table
- Social OAuth: Google + Apple + Facebook via Supabase dashboard configuration
- Password hashing: Supabase handles internally (bcrypt)
- Email delivery: Supabase + custom SMTP (Resend for production)
- Rate limiting: Supabase built-in + `slowapi>=0.1.9` in FastAPI
- Data export: ZIP of JSON (BackgroundTasks for MVP)
- Account deletion: Anonymize debate turns → delete private data → Supabase admin delete

---

## Phase 1: Design

**Status**: ✅ Complete — see [data-model.md](data-model.md), [contracts/](contracts/)

### Key Design Decisions

**1. No separate `users` table for auth state — use Supabase `auth.users` as the source of truth**

Supabase manages the `auth.users` table. The FastAPI backend maintains an `app_users` table (keyed on the same UUID) for application-level data (display name, preferences). This avoids duplicating auth state and lets Supabase handle email verification, password hashing, and social identity linking natively.

**2. Guest sessions are server-tracked, not client-tracked**

The 5-conversation limit is enforced by the FastAPI backend using the Supabase anonymous `sub` UUID as the key. This prevents trivial bypass via cookie deletion and makes the gate consistent across browser tabs.

**3. Conversation and Debate models get a nullable `user_id` FK**

Existing rows (anonymous) have `user_id = NULL`. New rows from authenticated users have `user_id` set. This preserves backward compatibility and enables the anonymous-to-registered migration (FR-013) by updating `user_id` on existing rows.

**4. Debate turn anonymization uses a denormalized `display_name` field**

Rather than JOINing to the user table on every debate render, each `debate_turns` row stores a `display_name` snapshot. On account deletion, this field is updated to `"Deleted User"` and `user_id` is set to NULL — preserving debate readability without retaining PII.

**5. Data export runs synchronously for MVP**

BackgroundTasks + StreamingResponse for the MVP. The Celery upgrade path (already in stack) is available when conversation volume grows. Export returns a ZIP of JSON files.

### New Environment Variables (backend `.env`)

```
SUPABASE_JWT_SECRET=<from Supabase dashboard: Project Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard: Project Settings → API → service_role key>
```

### New Environment Variables (web `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from Supabase dashboard: Project Settings → API → Publishable key>
```
