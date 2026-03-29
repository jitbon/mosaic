# Tasks: User Accounts & Authentication

**Input**: Design documents from `/specs/006-user-accounts/`
**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/auth-api.md](contracts/auth-api.md) · [contracts/web-routes.md](contracts/web-routes.md) · [quickstart.md](quickstart.md)

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies, configure environment variables, and create the new directory structure needed before any implementation begins.

- [X] T001 Add `python-jose[cryptography]==3.3.0` and `slowapi>=0.1.9` to `backend/requirements.txt` and install in venv
- [X] T002 Add `@supabase/supabase-js@^2.45.0` and `@supabase/ssr@^0.5.0` to `web/package.json` and run `npm install`
- [X] T003 [P] Add `SUPABASE_JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` fields to `backend/src/core/config.py` Settings class
- [X] T004 [P] Create `web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` placeholders (document in quickstart.md which Supabase dashboard page each value comes from)
- [X] T005 [P] Create directory `backend/src/services/auth/` with empty `__init__.py`
- [X] T006 [P] Create directory `web/lib/supabase/` for Supabase client utilities
- [X] T007 [P] Enable anonymous sign-ins in Supabase dashboard (document step in `specs/006-user-accounts/quickstart.md` Step 1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that MUST be complete before any user story can be implemented. Includes the database migration, JWT middleware, and Supabase client utilities shared by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Write Alembic migration `backend/alembic/versions/xxxx_add_user_accounts.py` — creates `app_users`, `user_preferences`, `social_accounts`, `guest_sessions` tables; adds `user_id` to `conversations` and `debates`; adds `user_id` + `display_name` to `debate_turns` (see `data-model.md` for full column specs and index list)
- [X] T009 Run `alembic upgrade head` and verify migration applies cleanly against local database; fix any SQL errors
- [X] T010 [P] Create `backend/src/models/user.py` — SQLAlchemy models for `User` (`app_users`), `UserPreference`, `SocialAccount` per `data-model.md`
- [X] T011 [P] Create `backend/src/models/guest_session.py` — SQLAlchemy `GuestSession` model per `data-model.md`
- [X] T012 [P] Modify `backend/src/models/conversation.py` — add nullable `user_id` UUID FK to `app_users.id` with `ON DELETE SET NULL` and index `ix_conversations_user_id`
- [X] T013 [P] Modify `backend/src/models/debate.py` — add nullable `user_id` UUID FK to `app_users.id` with `ON DELETE SET NULL` and index `ix_debates_user_id`
- [X] T014 [P] Modify `backend/src/models/debate_turn.py` — add nullable `user_id` FK and `display_name VARCHAR(100) NOT NULL DEFAULT 'AI'` per `data-model.md`
- [X] T015 Create `backend/src/core/auth.py` — FastAPI `HTTPBearer` dependency `get_current_user` that decodes Supabase HS256 JWT using `python-jose`; raise HTTP 401 on failure. Also provide `get_optional_user` (returns `None` instead of raising) and `require_authenticated` (raises 403 if `role != "authenticated"`)
- [X] T016 Create `backend/src/services/auth/supabase_client.py` — initialise two Supabase clients: anonymous client (anon key, for user-facing calls) and admin client (service_role key, for delete_user and admin operations)
- [X] T017 [P] Create `web/lib/supabase/client.ts` — `createBrowserClient` export using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [X] T018 [P] Create `web/lib/supabase/server.ts` — `createSupabaseServerClient()` factory using `@supabase/ssr` `createServerClient` with Next.js `cookies()` store
- [X] T019 Create `web/middleware.ts` — runs on all non-static routes; calls `supabase.auth.getUser()` to refresh tokens; redirects unauthenticated users away from `/profile` and `/history`; redirects authenticated users away from `/auth/login` and `/auth/signup` (see `contracts/web-routes.md` for full route protection table)

**Checkpoint**: Migration applied, JWT middleware tested locally with a Supabase test token, Supabase browser/server clients importable in Next.js. User story implementation can now begin.

---

## Phase 3: User Story 1 — Account Registration & Login (Priority: P1) 🎯 MVP

**Goal**: Visitors can register with email/password, verify their email, and log in. Sessions persist and protected routes are enforced.

**Independent Test**: Register a new account → verify email → log in → start a chat → log out → log in again → confirm chat appears in history (see `quickstart.md` Tests 1–2).

### Implementation

- [X] T020 [P] [US1] Create `backend/src/schemas/auth.py` — Pydantic schemas: `RegisterRequest`, `LoginRequest`, `TokenResponse`, `UserOut` (fields from `contracts/auth-api.md`)
- [X] T021 [P] [US1] Create `backend/src/schemas/user.py` — Pydantic schemas: `ProfileResponse`, `UpdateProfileRequest`, `UserPreferenceOut`
- [X] T022 [US1] Create `backend/src/services/auth/user_service.py` — functions: `create_user(email, display_name, user_id)` (inserts `app_users` + `user_preferences` row), `get_user_by_id(user_id)`, `update_last_login(user_id)` (depends on T010, T015, T016)
- [X] T023 [US1] Create `backend/src/api/v1/auth.py` — endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `POST /auth/forgot-password`, `POST /auth/resend-verification` per `contracts/auth-api.md`; wire `slowapi` rate limits (5/min login/register, 3/hr forgot-password and resend)
- [X] T024 [US1] Register auth router in `backend/src/main.py` under `/api/v1`
- [X] T025 [P] [US1] Create `web/app/auth/callback/route.ts` — PKCE code exchange handler: calls `supabase.auth.exchangeCodeForSession(code)`, then redirects to `?next` param or `/`; handles `type=recovery` redirect to `/auth/reset-password`
- [X] T026 [P] [US1] Create `web/app/auth/login/page.tsx` — login form (email + password), "Forgot password?" flow (calls `resetPasswordForEmail` + shows check-email message), "Sign Up" link; on success redirects to `?next` or `/`
- [X] T027 [P] [US1] Create `web/app/auth/signup/page.tsx` — registration form (display name, email, password with strength indicator); calls `POST /api/v1/auth/register`; on success shows "Check your email" message
- [X] T028 [P] [US1] Create `web/app/auth/reset-password/page.tsx` — new password + confirm fields; calls `supabase.auth.updateUser({ password })` after session is exchanged via callback route; redirects to `/` on success
- [X] T029 [US1] Create client-side `AuthProvider` in `web/components/AuthProvider.tsx` — wraps layout, exposes `user`, `isGuest`, `isAuthenticated`; listens to `onAuthStateChange` for `TOKEN_REFRESHED` / `SIGNED_OUT`; provides `signOut()` helper
- [X] T030 [US1] Add `AuthProvider` to `web/app/layout.tsx` and add Login/Signup nav buttons to the existing nav bar (shown when unauthenticated)

**Checkpoint**: Can register, verify email, log in, and log out. Protected routes (`/profile`, `/history`) redirect to `/auth/login`. Session survives page reload.

---

## Phase 4: User Story 2 — User Profile & Preferences (Priority: P2)

**Goal**: Registered users can view and update their profile, change password, export their data, and delete their account.

**Independent Test**: Log in → navigate to `/profile` → update display name → refresh → verify name persists; click "Export My Data" → receive ZIP; click "Delete Account" → confirm → verify logged out and debate turns anonymized (see `quickstart.md` Tests 6–7).

### Implementation

- [X] T031 [US2] Create `backend/src/api/v1/profile.py` — endpoints: `GET /profile`, `PATCH /profile`, `POST /profile/change-password`, `POST /profile/export`, `DELETE /profile` per `contracts/auth-api.md`; all require `get_current_user` dependency
- [X] T032 [US2] Create `backend/src/services/auth/export_service.py` — `generate_user_data_zip(user_id, db)`: queries `app_users`, `user_preferences`, `conversations` + `messages`, `debates` + `debate_turns` for the user; builds in-memory ZIP with `profile.json`, `conversations.json`, `debates.json`; returns `io.BytesIO`
- [X] T033 [US2] Create `backend/src/services/auth/deletion_service.py` — `request_account_deletion(user_id, db)`: sets `account_status = 'pending_deletion'` and `deleted_at = now()` on `app_users`; updates `debate_turns` rows to `display_name = 'Deleted User'`, `user_id = NULL`; deletes conversations + messages; calls Supabase admin `delete_user(user_id)`
- [X] T034 [US2] Register profile router in `backend/src/main.py` under `/api/v1`
- [X] T035 [US2] Create `web/app/profile/page.tsx` — Server Component; fetches profile from `GET /api/v1/profile`; renders: display name edit field, preferences selector, linked providers list, change-password form, "Export My Data" button (triggers `POST /api/v1/profile/export` → browser download), "Delete Account" button with confirmation modal

**Checkpoint**: Profile page fully functional. Export downloads a valid ZIP. After deletion, user is logged out, debate turns show "Deleted User", and re-login is rejected.

---

## Phase 5: User Story 3 — Social Login + Guest Mode (Priority: P3)

**Goal**: Visitors can sign in with Google, Apple, or Facebook, or continue as a guest with up to 5 ephemeral chat conversations. Debates require an account.

**Independent Test**: Click "Sign in with Google" → complete OAuth → verify account created; click "Continue as Guest" → start 5 chats → verify 6th is blocked with sign-up prompt; click "Start Debate" as guest → verify sign-up prompt appears (see `quickstart.md` Tests 1, 4).

### Implementation

- [X] T036 [P] [US3] Configure Google, Apple, and Facebook OAuth providers in Supabase dashboard (document steps in `specs/006-user-accounts/quickstart.md` Step 1a); add staging redirect URL allowlist entries
- [X] T037 [P] [US3] Add social sign-in buttons to `web/app/auth/login/page.tsx` — "Sign in with Google", "Sign in with Apple", "Sign in with Facebook" using `supabase.auth.signInWithOAuth({ provider })`; "Continue as Guest" link calls `supabase.auth.signInAnonymously()` then redirects to `/`
- [X] T038 [P] [US3] Add social sign-up buttons to `web/app/auth/signup/page.tsx` (same OAuth calls — Supabase handles create-or-link automatically)
- [X] T039 [US3] Create `backend/src/api/v1/auth.py` additions — `POST /auth/guest` endpoint (calls `signInAnonymously` server-side and returns token) and `GET /auth/guest/status` endpoint (returns `conversation_count`, `limit`, `limit_reached` from `guest_sessions` table) per `contracts/auth-api.md`
- [X] T040 [US3] Modify `backend/src/api/v1/chat.py` `POST /chat/conversations` — use `get_optional_user` dependency; if `role == "anon"`: upsert `guest_sessions` row, check `conversation_count >= 5` and return `HTTP 403 GUEST_LIMIT_REACHED`, else increment count; if `role == "authenticated"`: set `user_id` on new conversation; if no token: return `HTTP 401`
- [X] T041 [US3] Modify `backend/src/api/v1/debate.py` `POST /debate/debates` — use `require_authenticated` dependency; guests receive `HTTP 403 GUEST_DEBATES_RESTRICTED`
- [X] T042 [US3] Update `web/app/layout.tsx` nav bar — show guest chat counter badge ("3/5 chats used") when `isGuest` is true (read count from `GET /auth/guest/status`); show "Sign Up" CTA when limit reached
- [X] T043 [US3] Add inline guest-limit banner to chat UI in `web/app/chat/` — show "You've used all 5 guest chats. Sign up to keep going." with sign-up button when API returns `GUEST_LIMIT_REACHED`
- [X] T044 [US3] Add debate sign-up prompt to `web/app/debate/` — when guest clicks "Start Debate", show modal: "Debates require an account. Sign up to participate." (no API call made)

**Checkpoint**: All three social providers work end-to-end. Guest can use 5 chats and is blocked on the 6th. Debates are inaccessible to guests.

---

## Phase 6: User Story 4 — Anonymous Data Migration (Priority: P4)

**Goal**: A guest who registers can have their existing anonymous conversations migrated to their new account so no history is lost.

**Independent Test**: Start 3 anonymous conversations as guest → register a new account in the same browser → verify all 3 conversations appear in `/history` (see `quickstart.md` Test 5).

### Implementation

- [X] T045 [US4] Create `backend/src/services/auth/user_service.py` addition — `migrate_anonymous_to_user(anonymous_user_id, new_user_id, db)`: updates `conversations.user_id` and `debates.user_id` from `anonymous_user_id` to `new_user_id` where currently set to `anonymous_user_id`; sets `guest_sessions.converted_at = now()`
- [X] T046 [US4] Add `POST /auth/migrate-anonymous` endpoint to `backend/src/api/v1/auth.py` — requires `role == "authenticated"`; accepts `{ "anonymous_user_id": "uuid" }`; calls `migrate_anonymous_to_user`; returns migrated counts per `contracts/auth-api.md`
- [X] T047 [US4] Call migration in `web/app/auth/signup/page.tsx` post-registration flow — after successful registration, if `isGuest` was true before sign-up, call `POST /api/v1/auth/migrate-anonymous` with the previous anonymous session's `sub` UUID before redirecting

**Checkpoint**: Registering while a guest preserves all pre-registration conversations under the new account. History page shows combined history.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling hardening, Apple Sign-In edge cases, accessibility, and final integration checks.

- [X] T048 [P] Harden error messages in `web/app/auth/login/page.tsx` and `web/app/auth/signup/page.tsx` — ensure no response reveals whether an email exists (forgot-password and resend always return 200; login returns generic "Invalid credentials" message)
- [X] T049 [P] Handle Apple private relay email edge case in `backend/src/services/auth/user_service.py` — when `provider_email` matches `*@privaterelay.appleid.com`, store it in `social_accounts.provider_email` but do not overwrite `app_users.email` if already set
- [X] T050 [P] Add `slowapi` Redis backend configuration to `backend/src/core/config.py` and wire it into the rate limiter in `backend/src/api/v1/auth.py` (use existing `redis_url` setting)
- [X] T051 [P] Add `GET /chat/conversations` filter in `backend/src/api/v1/chat.py` — authenticated users see only their own; guests see only their anonymous session's conversations (filter by `user_id = anon_sub`)
- [X] T052 [P] Add web deletion URL page for Google Play compliance — create `web/app/account-deletion/page.tsx` with a simple form that unauthenticated users can use to request deletion by email (document URL in Google Play Console Data Safety form)
- [X] T053 Run all 7 quickstart test scenarios from `specs/006-user-accounts/quickstart.md` manually and fix any failures
- [X] T054 Update `CLAUDE.md` via `.specify/scripts/bash/update-agent-context.sh claude` if any new tech was introduced during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all tasks are independent
- **Foundational (Phase 2)**: Requires Phase 1 complete — **blocks all user stories**
- **US1 (Phase 3)**: Requires Phase 2 complete
- **US2 (Phase 4)**: Requires Phase 2 + US1 complete (profile depends on `app_users` existing from US1 registration flow)
- **US3 (Phase 5)**: Requires Phase 2 complete; independent of US1/US2 except for shared auth endpoints (T023)
- **US4 (Phase 6)**: Requires Phase 2 + US1 (migration needs `app_users` + `conversations.user_id`) + US3 (needs guest sessions)
- **Polish (Phase 7)**: Requires all user story phases complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|-----------|----------------|
| US1 (Registration/Login) | Phase 2 | T019 complete |
| US2 (Profile/Preferences) | Phase 2, US1 | T030 complete |
| US3 (Social Login + Guest) | Phase 2 | T019 complete (US3 shares auth endpoints with US1) |
| US4 (Anonymous Migration) | Phase 2, US1, US3 | T044 complete |

### Within Each Phase

- [P]-marked tasks can run in parallel
- Models (T010–T014) before services (T022, T031–T033)
- Services before endpoints (T023, T031, T039–T041)
- Backend endpoints before frontend pages

---

## Parallel Opportunities

### Phase 2 (Foundational) — run together after T008–T009
```
T010 user.py model
T011 guest_session.py model        ← parallel with T010
T012 conversation.py modification  ← parallel with T010, T011
T013 debate.py modification        ← parallel with T010, T011, T012
T014 debate_turn.py modification   ← parallel with T010–T013
T017 web/lib/supabase/client.ts    ← parallel with all above
T018 web/lib/supabase/server.ts    ← parallel with all above
```

### Phase 3 (US1) — run together
```
T020 schemas/auth.py     ← parallel
T021 schemas/user.py     ← parallel
T025 auth/callback       ← parallel
T026 auth/login page     ← parallel
T027 auth/signup page    ← parallel
T028 auth/reset-password ← parallel
```

### Phase 5 (US3) — run together
```
T036 Supabase provider config    ← parallel
T037 login page social buttons   ← parallel
T038 signup page social buttons  ← parallel
T043 guest limit banner (chat)   ← parallel
T044 debate sign-up prompt       ← parallel
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (⚠️ blocks everything)
3. Complete Phase 3: US1 (Registration & Login)
4. **STOP and validate**: run quickstart Tests 2–3, verify protected routes work
5. Deploy/demo: users can register, log in, and their chat history persists

### Incremental Delivery

1. Setup + Foundational → auth infrastructure ready
2. US1 → register/login/logout ✅ Deploy
3. US2 → profile, export, delete ✅ Deploy (App Store compliant)
4. US3 → social login + guest mode ✅ Deploy
5. US4 → anonymous migration ✅ Deploy
6. Polish → harden, compliance checks

### Parallel Team Strategy (2 developers)

After Phase 2 completes:
- **Dev A**: US1 backend (T020–T024) then US2 backend (T031–T034)
- **Dev B**: US1 frontend (T025–T030) then US3 frontend (T037–T038, T042–T044)

---

## Notes

- [P] tasks touch different files with no dependency on incomplete tasks — safe to run in parallel
- [Story] labels map each task to a spec user story for traceability
- No test tasks generated (not requested in spec)
- Apple Sign-In requires a real domain — use ngrok or staging for local OAuth testing (see `quickstart.md`)
- The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser; it is backend-only
- Commit after each phase checkpoint to preserve a working state
- After T053 (quickstart validation), any failures should be fixed before marking tasks complete

---

**Total tasks**: 54
**By story**: US1 = 11 · US2 = 5 · US3 = 9 · US4 = 3 · Setup = 7 · Foundational = 12 · Polish = 7
**Parallel opportunities**: 25 tasks marked [P]
**MVP scope**: Phases 1–3 (T001–T030) — 30 tasks
