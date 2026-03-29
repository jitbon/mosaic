# Research: User Accounts & Authentication

**Feature**: 006-user-accounts
**Date**: 2026-03-22
**Branch**: `006-user-accounts`

---

## 1. Authentication Provider

**Decision**: Supabase Auth (already in stack — `supabase_url` and `supabase_key` exist in `backend/src/core/config.py`)

**Rationale**: Supabase Auth is already configured in the project. It provides email/password auth, social OAuth (Google, Apple, Facebook), anonymous sign-in (guest sessions), built-in bcrypt password hashing, JWT issuance, and token refresh — all without additional infrastructure. Using it avoids introducing Clerk or a second auth system.

**Alternatives considered**:
- Clerk — full-featured but a second managed service cost; redundant given Supabase is already present
- Auth0 — similar overlap; overkill for current scale
- Custom JWT with `passlib`/`python-jose` only — high implementation burden, reinvents what Supabase provides for free

---

## 2. JWT Verification in FastAPI

**Decision**: `python-jose[cryptography]==3.3.0` with HS256 using the `SUPABASE_JWT_SECRET`

**Rationale**: Supabase issues HS256-signed JWTs. `python-jose` integrates cleanly with FastAPI dependency injection via `HTTPBearer`. The JWT secret is available in the Supabase dashboard under Project Settings → API → JWT Secret.

**Key JWT claims**:
- `sub` — user UUID (primary identifier, always present)
- `email` — present for authenticated users, absent for anonymous
- `role` — `"authenticated"` for full accounts, `"anon"` for guest sessions
- `app_metadata.provider` — `"google"`, `"apple"`, `"facebook"`, `"email"`

**Pattern**: FastAPI `Depends` on a `get_current_user` function that decodes and validates the token. Guest endpoints accept both `"authenticated"` and `"anon"` roles; protected endpoints require `"authenticated"` only.

**Gotchas**:
- Use the JWT Secret as a plain string, not base64-decoded
- Never cache decoded tokens beyond their `exp`
- Use `getUser()` in Next.js (not `getSession()`) — `getSession()` does not validate server-side

---

## 3. Password Hashing

**Decision**: Supabase Auth handles bcrypt internally — no backend implementation needed

**Rationale**: GoTrue (Supabase Auth) hashes passwords with bcrypt (cost factor 10) before storage. The `auth.users.encrypted_password` column stores the hash. No `passlib` or `argon2-cffi` required in the FastAPI backend.

---

## 4. Social OAuth Providers

**Decision**: Configure Google, Apple, and Facebook via Supabase dashboard. No custom OAuth code in FastAPI or Next.js beyond the Supabase client SDK calls.

**Setup per provider**:
- All three are enabled in Supabase Dashboard → Authentication → Providers
- Supabase callback URL (`https://<project>.supabase.co/auth/v1/callback`) is registered in each provider's developer console

**Apple Sign-In specifics** (most complex):
- Requires a Service ID (not App Bundle ID), Team ID, Key ID, and `.p8` private key file
- Apple only provides the user's real name on the **first** authorization — must capture from client-side response and upsert immediately
- Private relay emails (`xyz@privaterelay.appleid.com`) become the user's email in Supabase — cannot look up by real email
- Requires a real domain with TLS for OAuth redirect (no localhost); use a staging subdomain during development

**Facebook specifics**:
- Requires HTTPS and a verified domain in the Meta developer portal

---

## 5. Guest / Anonymous Sessions

**Decision**: Supabase built-in anonymous sign-in (`supabase.auth.signInAnonymously()`) + `guest_sessions` table in FastAPI backend to track conversation count

**Rationale**: Supabase anonymous sign-in (GA as of late 2024) issues a real JWT with `role: "anon"` and a stable `sub` UUID. This avoids cookies, fingerprinting, or custom session tokens. When a guest upgrades to a full account, the `sub` UUID is preserved — all data linked to it remains intact.

**Guest session tracking** (5-conversation limit):
```sql
CREATE TABLE guest_sessions (
    user_id UUID PRIMARY KEY,       -- Supabase anon sub
    conversation_count INT NOT NULL DEFAULT 0,
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    converted_at TIMESTAMPTZ        -- set on account registration/link
);
```
- Increment `conversation_count` on each conversation start; reject (HTTP 403) if ≥ 5
- Enable in Supabase Dashboard → Authentication → Settings → "Enable anonymous sign-ins"

**Gotcha**: Anonymous sessions expire like regular sessions. If a user clears browser storage, they get a new anonymous identity and a fresh limit — acceptable UX tradeoff for a soft gate.

---

## 6. Next.js Auth (SSR)

**Decision**: `@supabase/ssr@^0.5.0` with `middleware.ts` for session refresh, cookie-based session storage, and `createServerClient` in Server Components

**Key packages**:
- `@supabase/supabase-js@^2.45.0`
- `@supabase/ssr@^0.5.0`

**Pattern**:
- `middleware.ts` at web root runs on every request, calls `supabase.auth.getUser()` to refresh expiring tokens and write updated cookies
- Server Components use `createServerClient` with the Next.js `cookies()` store (read-only in RSC, read-write in middleware and Route Handlers)
- Auth callback route at `app/auth/callback/route.ts` exchanges PKCE code for session after OAuth or email confirmation redirects
- Client Components use `createBrowserClient` which handles silent refresh automatically

**Route protection**: `middleware.ts` redirects unauthenticated users away from `/history`, `/profile`, and other protected paths.

---

## 7. Email Flow

**Decision**: Supabase built-in transactional email with a custom SMTP provider (Resend recommended) for production

**Rationale**: Supabase's default mailer is rate-limited (~3 emails/hour on free tier) — insufficient for production. Connect a custom SMTP provider via Dashboard → Project Settings → Auth → SMTP Settings.

**Recommended provider**: Resend (developer-friendly, generous free tier, simple API)

**Email types handled by Supabase (no custom code)**:
- Email verification (confirm sign-up)
- Password reset
- Email change confirmation

**Token expiry**: OTP/recovery tokens default to 1 hour. Configurable in Dashboard → Authentication → Settings → "OTP Expiry".

---

## 8. Rate Limiting

**Decision**: Rely on Supabase Auth built-in limits + add `slowapi` in FastAPI for any custom auth-adjacent endpoints

**Supabase built-in limits** (per IP):
- Sign up: 3/hour
- Sign in: 30/5 minutes
- Password reset: 2/hour

**FastAPI `slowapi` limits** (for custom endpoints wrapping auth actions):
- Login/register proxy: `5/minute`
- Password reset request: `3/hour`
- Email resend: `3/hour`
- Use Redis as the slowapi backend (already in stack): `storage_uri="redis://..."`

**Package**: `slowapi>=0.1.9`

---

## 9. Data Export

**Decision**: BackgroundTasks for initial MVP export (synchronous ZIP generation); upgrade to Celery task + S3 signed URL if user data exceeds threshold

**Format**: ZIP archive containing JSON files:
- `profile.json` — display name, email, preferences
- `conversations.json` — all chat conversations with messages
- `debates.json` — all debate sessions with turns

**Implementation**: `POST /api/v1/account/export` triggers export; for MVP returns a streaming `StreamingResponse` with `application/zip`. Celery upgrade path ready (already in stack) when conversations exceed ~1k rows.

**Compliance**: Satisfies GDPR Article 20 (data portability) and is recommended (not yet required) by Apple App Store and Google Play Store.

---

## 10. Account Deletion

**Decision**: Two-phase deletion — anonymize shared content, then delete private data and Supabase Auth identity

**Pattern**:
1. Update `debate_turns` rows: set `display_name = "Deleted User"`, `user_id = NULL`
2. Delete private data: conversations, messages, profile, preferences
3. Call Supabase Admin API: `supabase.auth.admin.delete_user(user_id)` (requires `service_role` key)
4. Mark `users` row as deleted (soft delete with `deleted_at` timestamp, hard delete after 30 days)

**SQLAlchemy FK pattern**: `ForeignKey("users.id", ondelete="SET NULL")` on `debate_turns.user_id` (column must be `nullable=True`)

**Compliance**:
- Apple App Store: **Required** — in-app account deletion (mandated since June 2022)
- Google Play Store: **Required** — in-app deletion + web-accessible deletion URL (mandated since December 2023)

---

## 11. Session Lifetime

**Decision**: Access tokens: 1 hour (Supabase default). Refresh tokens: non-expiring with rotation enabled.

**Spec SC-004 target**: "users never unexpectedly logged out during a session lasting up to 7 days" — satisfied by Supabase refresh token rotation (refresh tokens are invalidated only on use or explicit logout, not by time expiry in default config).

---

## Resolved NEEDS CLARIFICATION Items

All `NEEDS CLARIFICATION` items from the plan template are resolved:

| Item | Resolution |
|------|-----------|
| Language/Version | Python 3.11 (existing backend), TypeScript 5.x / Next.js 15 (existing web) |
| Auth library | Supabase Auth (existing in stack) + `python-jose` for backend JWT verification |
| Social providers | Google + Apple + Facebook via Supabase dashboard |
| Guest session mechanism | Supabase anonymous sign-in + `guest_sessions` table |
| Password hashing | Supabase Auth (bcrypt, no backend code needed) |
| Email delivery | Supabase + custom SMTP (Resend) |
| Rate limiting | Supabase built-in + `slowapi` with Redis backend |
| Data export format | ZIP of JSON files |
| Deletion behavior | Anonymize debate turns, delete private data, Supabase admin delete |
| App Store compliance | In-app delete (both required), web delete URL (Google required), data export (recommended) |
