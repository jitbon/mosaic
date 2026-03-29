# Quickstart: User Accounts & Authentication

**Feature**: 006-user-accounts
**For**: Developers implementing or testing this feature locally

---

## Prerequisites

- Docker running (for PostgreSQL + Redis)
- Node.js 22 LTS and pnpm/npm
- Python 3.11 + venv
- A Supabase project (free tier is fine for development)

---

## Step 1: Configure Supabase

### 1a. Enable required auth providers

In your Supabase dashboard:

1. **Authentication → Settings**:
   - Enable "Confirm email" (email verification)
   - Enable "Enable anonymous sign-ins"
   - Set JWT expiry: 3600 (default)

2. **Authentication → Providers** — enable:
   - **Email** (already on by default)
   - **Google** — paste Google OAuth Client ID + Secret
   - **Apple** — paste Service ID, Team ID, Key ID, p8 key contents
   - **Facebook** — paste App ID + App Secret

3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

4. **Authentication → Email Templates** (optional for dev):
   - Customise if needed; defaults work fine locally

### 1b. Get your credentials

From Supabase dashboard → Project Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `Publishable` key (formerly "anon / public") → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `JWT Secret` → `SUPABASE_JWT_SECRET`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**never expose client-side**)

---

## Step 2: Configure environment variables

### Backend (`backend/.env` — add to existing file)

```bash
SUPABASE_JWT_SECRET=your-jwt-secret-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Web frontend (`web/.env.local` — create if missing)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
```

---

## Step 3: Install new dependencies

### Backend

```bash
cd backend
source venv/bin/activate
pip install python-jose[cryptography]==3.3.0 slowapi>=0.1.9
pip freeze > requirements.txt
```

### Web frontend

```bash
cd web
npm install @supabase/supabase-js@^2.45.0 @supabase/ssr@^0.5.0
```

---

## Step 4: Run the database migration

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

This applies the `xxxx_add_user_accounts.py` migration which:
- Creates `app_users`, `user_preferences`, `social_accounts`, `guest_sessions`
- Adds `user_id` to `conversations` and `debates`
- Adds `user_id` and `display_name` to `debate_turns`

---

## Step 5: Start the development servers

Use the existing dev script from the repo root:

```bash
./dev.sh
```

Or start individually:

```bash
# Backend
cd backend && source venv/bin/activate && uvicorn src.main:app --reload --port 8000

# Web frontend
cd web && npm run dev
```

---

## Step 6: Test the auth flows

### Test 1: Guest session + chat limit

1. Open `http://localhost:3000` in a private browser window
2. Click "Continue as Guest" — you should be redirected to the feed
3. Start 5 chat conversations
4. On the 6th attempt, verify you see the sign-up prompt

### Test 2: Email/password registration

1. Click "Sign Up" and register with a test email
2. Check your email (or Supabase dashboard → Authentication → Users to see the pending verification)
3. Click the verification link
4. Log in and verify you're redirected to the feed

### Test 3: Password reset

1. Click "Forgot password?" on the login page
2. Enter your email
3. Click the reset link from the email
4. Set a new password and verify you can log in

### Test 4: Social login (requires provider credentials)

1. Configure at least one provider (Google is easiest)
2. Click "Sign in with Google" and complete the OAuth flow
3. Verify an account is created in Supabase Auth dashboard

### Test 5: Anonymous-to-registered migration

1. Start a guest session and create 2 conversations
2. Register a new account in the same browser
3. Call `POST /api/v1/auth/migrate-anonymous` (done automatically by the UI)
4. Log in and verify the 2 conversations appear in `/history`

### Test 6: Data export

1. Log in as a registered user with some conversations
2. Go to `/profile` → click "Export My Data"
3. Verify you receive a ZIP file containing `profile.json`, `conversations.json`, `debates.json`

### Test 7: Account deletion

1. Log in
2. Go to `/profile` → click "Delete Account" → confirm
3. Verify you are logged out and a confirmation banner appears
4. Verify you cannot log in immediately (account is `pending_deletion`)
5. Check the database to verify debate turns show "Deleted User"

---

## Key files to review before implementing

| File | Purpose |
|------|---------|
| [data-model.md](data-model.md) | All new tables + modifications to existing tables |
| [contracts/auth-api.md](contracts/auth-api.md) | All backend API endpoint contracts |
| [contracts/web-routes.md](contracts/web-routes.md) | Frontend routes, middleware, and auth state |
| [research.md](research.md) | Technology decisions + gotchas |
| `backend/src/core/config.py` | Where to add new env vars |
| `backend/src/models/conversation.py` | Existing model to modify |
| `web/lib/api.ts` | Existing API client to extend |

---

## Common gotchas

- **Apple Sign-In**: Requires a real domain (not localhost) for the OAuth redirect. Use ngrok or a staging subdomain during development.
- **`getSession()` vs `getUser()`**: Always use `supabase.auth.getUser()` in server-side code. `getSession()` reads from cookies without server validation and can be spoofed.
- **JWT Secret vs Service Role Key**: The JWT Secret is for verifying tokens in FastAPI. The Service Role Key is for Supabase Admin API calls (delete user, etc.) and must never be exposed to the browser.
- **Anonymous session expiry**: If a guest clears browser storage, they get a new anonymous identity and a fresh conversation limit. This is by design.
- **Supabase `auth.users` vs `app_users`**: Never write to `auth.users` directly. Use the Supabase Auth API or Admin API. The `app_users` table is your application's view of the user.
