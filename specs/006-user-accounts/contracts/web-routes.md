# Web Routes Contract: Authentication UI

**Feature**: 006-user-accounts
**Framework**: Next.js 15 App Router
**Auth**: `@supabase/ssr` with cookie-based sessions + `middleware.ts`

---

## Route Protection Rules

Enforced in `middleware.ts`:

| Path pattern | Access rule |
|---|---|
| `/login`, `/signup`, `/auth/*` | Redirect to `/` if already authenticated |
| `/profile` | Redirect to `/login?next=/profile` if unauthenticated |
| `/history` | Redirect to `/login?next=/history` if unauthenticated |
| `/` (feed), `/story/*` | Public — accessible to all (including guests) |
| `/chat/*`, `/debate/*` | Guest access allowed; guest limit enforced by API |

---

## New Routes

### `/auth/login`
**Page component**: `app/auth/login/page.tsx`
**Access**: Public (unauthenticated only; redirect authenticated users)

**UI elements**:
- Email + password form with "Log In" submit
- "Forgot password?" link → triggers `resetPasswordForEmail` + shows "Check your email" message
- "Sign in with Google" button
- "Sign in with Apple" button
- "Sign in with Facebook" button
- "Continue as Guest" link → calls `signInAnonymously()` + redirects to `/`
- "Don't have an account? Sign up" link → `/auth/signup`

**Behaviour**:
- On successful login: redirect to `?next` param or `/`
- On error: inline error message (never reveal whether email exists)
- Guest sign-in: initializes anonymous session, redirects to `/`

---

### `/auth/signup`
**Page component**: `app/auth/signup/page.tsx`
**Access**: Public (unauthenticated only)

**UI elements**:
- Display name, email, password fields
- "Create Account" submit
- Password strength indicator (min 8 chars, uppercase, number)
- "Already have an account? Log in" link → `/auth/login`
- Social sign-up buttons (same as login — Supabase handles create-or-link)

**Behaviour**:
- On success: show "Check your email to verify your account" message; do not auto-login
- If user was a guest: call `POST /api/v1/auth/migrate-anonymous` with the current anonymous `sub` before redirecting
- On duplicate email: "An account with this email already exists."

---

### `/auth/reset-password`
**Page component**: `app/auth/reset-password/page.tsx`
**Access**: Only accessible after clicking password reset email link (requires valid recovery code in URL)

**UI elements**:
- New password + confirm password fields
- "Set New Password" submit

**Behaviour**:
- On page load: exchange the `?code=` param for a session via the auth callback route
- On submit: call `supabase.auth.updateUser({ password: newPassword })`
- On success: redirect to `/` with session active

---

### `/auth/callback`
**Route handler**: `app/auth/callback/route.ts`
**Access**: Public

**Purpose**: PKCE code exchange endpoint. Handles redirects from:
- Email verification links
- Password reset links
- OAuth provider redirects (Google, Apple, Facebook)

**Behaviour**:
- Extract `code` from query params
- Call `supabase.auth.exchangeCodeForSession(code)`
- On success: redirect to `?next` param, or `/` for auth flows, or `/auth/reset-password` for recovery flows
- On failure: redirect to `/auth/login?error=auth_callback_failed`

---

### `/profile`
**Page component**: `app/profile/page.tsx`
**Access**: 🔒 Authenticated only

**UI elements**:
- Display name edit field + save button
- Email display (read-only; shows "Change email" link if needed)
- Default perspective selector
- "Linked accounts" section: shows linked Google/Apple/Facebook
- "Change Password" form (current password + new password)
- "Export My Data" button → calls `POST /api/v1/profile/export`, triggers ZIP download
- "Delete Account" button → confirmation modal → calls `DELETE /api/v1/profile`

**Behaviour**:
- All changes call `PATCH /api/v1/profile`
- After export request: show "Preparing your download…" then trigger browser download
- After delete confirmation: log out, redirect to `/` with banner "Your account has been scheduled for deletion."

---

## Modified Routes

### `/` (feed page)
- If authenticated: show user display name / avatar in nav; show "History" nav link
- If guest: show "Sign Up" and "Log In" nav buttons; show guest chat counter badge (e.g. "3/5 chats used")
- If no session: auto-initialize guest session via `signInAnonymously()` on first visit

### `/chat/[id]` and `/debate/[id]`
- Guest users: chat is allowed (up to limit); debate shows "Sign up to start a debate" prompt
- When guest limit reached: inline banner "You've used all 5 guest chats. Sign up to keep going."

### `/history`
- 🔒 Protected; lists all conversations and debates for the authenticated user

---

## Auth State Provider

A client-side `AuthProvider` context component wraps the app layout to:
- Expose `user`, `isGuest`, `isAuthenticated` state
- Listen for `onAuthStateChange` events from Supabase (handles `TOKEN_REFRESHED`, `SIGNED_OUT`)
- Provide `signOut()` helper that calls Supabase signOut + redirects to `/auth/login`

---

## Supabase Client Files

### `lib/supabase/client.ts` (browser client)
Used in Client Components and event handlers.
```ts
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
```

### `lib/supabase/server.ts` (server client)
Used in Server Components, Route Handlers, and `middleware.ts`.
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createSupabaseServerClient() { ... }
```

### `middleware.ts` (root)
- Runs on every request matching `/((?!_next/static|_next/image|favicon.ico).*)`
- Calls `supabase.auth.getUser()` to refresh expiring tokens
- Applies route protection redirects (see table above)
