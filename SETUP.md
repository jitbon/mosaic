# Mosaic Setup Checklist

**What you actually have to do manually: Steps 1–4.**
Steps 5–6 are already done. Step 7 starts the app.

---

## Step 1 — Get API keys

- [ ] **Anthropic** — already in your `.env` ✅
- [ ] **GNews** — sign up at https://gnews.io (free tier), copy your API key
- [ ] **Supabase** — create a project at https://supabase.com (free tier), then go to **Project Settings → API** and note:
  - Project URL
  - `anon / public` key
  - `service_role` key
  - JWT Secret (scroll down on the same API page)

---

## Step 2 — Fill in environment files

You need to edit **3 files**:

### `backend/.env`

Add/fill in these values:

- [ ] `GNEWS_API_KEY=` → your GNews key
- [ ] `SUPABASE_URL=` → Supabase Project URL (e.g. `https://abcdef.supabase.co`)
- [ ] `SUPABASE_KEY=` → Supabase `anon / public` key
- [ ] `SUPABASE_JWT_SECRET=` → **add this new line** → Supabase JWT Secret
- [ ] `SUPABASE_SERVICE_ROLE_KEY=` → **add this new line** → Supabase `service_role` key ⚠️ never put this in web files

### `web/.env.local`

- [ ] `NEXT_PUBLIC_SUPABASE_URL=` → same Supabase Project URL
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` → same `anon / public` key

### `.env` (repo root)

This is used by the devcontainer to inject env vars into the running container:

- [ ] `GNEWS_API_KEY=` → same GNews key
- [ ] `SUPABASE_URL=` → same Supabase Project URL
- [ ] `SUPABASE_KEY=` → same `anon / public` key

> `ANTHROPIC_API_KEY` is already filled in the root `.env` ✅

---

## Step 3 — Configure Supabase dashboard

In your Supabase project:

### Authentication → Settings
- [ ] Turn on **"Enable email confirmations"**
- [ ] Turn on **"Enable anonymous sign-ins"**

### Authentication → URL Configuration
- [ ] **Site URL:** `http://localhost:3000`
- [ ] **Redirect URLs:** add `http://localhost:3000/**`

### Authentication → Providers
- [ ] Confirm **Email** is enabled (on by default)
- [ ] *(Optional)* **Google** — need a Google Cloud OAuth client ID + secret
- [ ] *(Optional)* **Apple** — needs Apple Developer account + real domain (won't work on localhost)
- [ ] *(Optional)* **Facebook** — need a Meta developer app ID + secret

> Social login is optional for local dev. Email/password and guest mode work without it.

---

## Step 4 — Create mobile env file (only if running the mobile app)

- [ ] Copy `mobile/.env.example` → `mobile/.env`
- [ ] Set `EXPO_PUBLIC_API_URL=http://localhost:8000` (default is already correct for local dev)

---

## Steps 5–6 — Already done ✅

| | What | Status |
|---|---|---|
| 5 | Dependencies installed (backend + web) | ✅ Done |
| 6 | Database migration applied (`007_add_user_accounts`) | ✅ Done |

If you ever reset the database or clone fresh:
```bash
cd backend && source venv/bin/activate && alembic upgrade head
```

---

## Step 7 — Start the app

```bash
./dev.sh
```

Opens http://localhost:3000 automatically.

---

## Step 8 — Smoke test

- [ ] News feed loads on the home page
- [ ] **"Continue as Guest"** works → guest badge shows in top nav with chat counter
- [ ] **"Sign Up"** → fill in the form → "Check your email" appears
- [ ] Click the verification link in the email → logged in, redirected to feed
- [ ] `/profile` loads and shows your display name
- [ ] **"Export My Data"** → ZIP downloads
- [ ] **Sign Out** → nav shows Sign In / Sign Up

---

## Gotchas

- **`SUPABASE_JWT_SECRET` ≠ `SUPABASE_KEY`** — both are on the same API settings page but are different values; both are required
- **`SUPABASE_SERVICE_ROLE_KEY`** — goes in `backend/.env` only, never in `web/.env.local`
- **Apple Sign-In** — won't work on localhost; needs ngrok or a real domain
- **Supabase emails in spam** — check Supabase dashboard → Authentication → Logs
- **Chat returns 401** — means you're not authenticated; click "Continue as Guest" or sign in first
