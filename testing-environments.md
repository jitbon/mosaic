# Testing Environments: User Accounts & Authentication

**Feature**: 006-user-accounts
**For**: Developers verifying auth flows across local, staging, and production environments

---

## Overview

The auth system touches three layers simultaneously:

1. **Supabase** — JWT issuance, anonymous sign-ins, OAuth redirects, email verification
2. **FastAPI backend** — JWT verification, guest limits, rate limiting, data export/deletion
3. **Next.js frontend** — middleware session refresh, protected routes, auth pages

Each environment needs its own Supabase project because Supabase manages `auth.users` directly and you cannot safely share that table between environments.

---

## Environment Summary

| Concern | Local | Dev/Staging | Production |
|---------|-------|-------------|------------|
| Supabase project | Local or dedicated dev project | Dedicated staging project | Dedicated prod project |
| Database | Docker (localhost) | RDS / Supabase Postgres | RDS / Supabase Postgres |
| Redis | Docker (localhost) | ElastiCache / Upstash | ElastiCache / Upstash |
| Email verification | Disabled or Supabase sandbox | Sendgrid/SES test sender | Real sender |
| Social OAuth redirect | `http://localhost:3000` | `https://staging.yourdomain.com` | `https://yourdomain.com` |
| Apple Sign-In | Not testable (requires real domain) | Testable with ngrok or staging subdomain | Fully functional |
| Rate limiting | Relaxed (dev override) | Mirroring production values | Production values |
| Data deletion | Instant (no 30-day hold) | Instant or short hold | 30-day grace period |

---

## 1. Local Environment

### What you can test locally

- Email/password registration and login
- Email verification (via Supabase dashboard, no real emails needed)
- Guest session initialization and 5-conversation limit
- Anonymous-to-registered migration
- Profile update, password change
- Data export (ZIP download)
- Account deletion (both anonymization of debate turns and hard-delete of private data)
- Protected route redirects (`/profile`, `/history`)
- JWT verification by FastAPI
- Rate limiting (can be temporarily relaxed in config)

### What you cannot test locally

- Real email delivery (use Supabase dashboard to inspect/approve)
- Apple Sign-In (OAuth redirect requires a publicly reachable HTTPS domain)
- Social OAuth if your Google/Facebook app credentials restrict redirect URIs to HTTPS

### Setup

**1. Supabase dashboard settings** (one-time per dev account)

In your Supabase project → Authentication → Settings:
- Enable "Enable anonymous sign-ins"
- Disable "Confirm email" **OR** use the Supabase dashboard to manually confirm users during testing
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/**`

In Authentication → Providers:
- Email: enabled (default)
- Google: paste OAuth Client ID + Secret if testing social login
- Facebook: paste App ID + Secret if testing social login
- Apple: skip (requires real domain)

**2. Environment variables**

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mosaic
REDIS_URL=redis://localhost:6379/0
SUPABASE_JWT_SECRET=<from Supabase dashboard → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API → service_role key>

# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<key>
```

**3. Start services**

```bash
# From repo root — starts Docker (Postgres + Redis) + backend + frontend
./dev.sh
```

Or individually:
```bash
docker compose -f .devcontainer/docker-compose.yml up -d
cd backend && source venv/bin/activate && uvicorn src.main:app --reload --port 8000
cd web && npm run dev
```

**4. Apply migrations**

```bash
cd backend && source venv/bin/activate && alembic upgrade head
```

### Test scripts (manual)

Run these in order in a browser against `http://localhost:3000`:

| # | Test | Steps | Expected |
|---|------|--------|----------|
| L1 | Guest session created | Load app in private window, click "Continue as Guest" | Redirected to feed; no account required |
| L2 | Guest chat limit enforced | Start 5 chats as guest | 6th attempt shows sign-up prompt |
| L3 | Guest cannot debate | Click Debate as guest | Prompted to create an account |
| L4 | Email registration | Click Sign Up, submit valid email + password | Verification email sent; user in `pending` state |
| L5 | Email verification | In Supabase dashboard → Auth → Users, confirm email manually (or click real link) | Account activated |
| L6 | Login | Log in with verified credentials | Redirected to feed; session cookie set |
| L7 | Protected route — authenticated | Navigate to `/profile` while logged in | Profile page loads |
| L8 | Protected route — guest | Navigate to `/profile` while guest | Redirected to `/auth/login?next=/profile` |
| L9 | Migration: guest → registered | Create 2 chats as guest, then register (same browser) | POST `/auth/migrate-anonymous` fired; chats appear in history |
| L10 | Password reset | Click "Forgot password?", request reset, use reset link | New password accepted |
| L11 | Data export | Profile page → Export My Data | ZIP downloaded with profile.json, conversations.json, debates.json |
| L12 | Account deletion | Profile → Delete Account → confirm | Logged out; debate turns show "Deleted User"; private data deleted |
| L13 | JWT rejection | Call any 🔒 endpoint with expired/invalid token | `401 Unauthorized` |
| L14 | Rate limiting | Call `POST /auth/login` 6 times in 1 minute | 6th call returns `429 Too Many Requests` |

### Inspecting results without a UI

```bash
# Check guest_sessions table
psql $DATABASE_URL -c "SELECT * FROM guest_sessions ORDER BY created_at DESC LIMIT 5;"

# Check app_users
psql $DATABASE_URL -c "SELECT id, email, display_name, status FROM app_users ORDER BY created_at DESC LIMIT 5;"

# Check debate_turns for anonymization
psql $DATABASE_URL -c "SELECT id, user_id, display_name FROM debate_turns WHERE display_name = 'Deleted User';"

# FastAPI OpenAPI docs (interactive)
open http://localhost:8000/docs
```

---

## 2. Dev/Staging Environment

Staging is a near-production clone used to test auth flows that require a real HTTPS domain (Apple Sign-In, production-like email delivery) and to validate before deploying to production.

### Infrastructure changes from local

| Component | Local | Staging |
|-----------|-------|---------|
| Backend | `uvicorn --reload` on localhost | Container on ECS / Railway / Fly.io |
| Database | Docker Postgres | RDS or Supabase Postgres (staging project) |
| Redis | Docker | ElastiCache or Upstash Redis |
| Domain | `localhost:3000` | `https://staging.yourdomain.com` |
| TLS | None | Managed by load balancer or Fly.io |
| Supabase project | Dev project | Separate staging project |

### Setting up a staging Supabase project

1. Create a **new Supabase project** — never share with local dev or production
2. In Authentication → Settings:
   - Site URL: `https://staging.yourdomain.com`
   - Redirect URLs: `https://staging.yourdomain.com/**`
3. In Authentication → Providers:
   - Google OAuth: add `https://staging.yourdomain.com/auth/callback` as an authorized redirect URI in Google Cloud Console
   - Apple: add staging domain to your Apple Service ID allowed domains
   - Facebook: add staging domain to Facebook app's OAuth redirect URIs
4. In Authentication → Email Templates: set "From" to a real sender (Sendgrid/SES configured in Supabase SMTP settings)

### Staging environment variables

Set these as secrets in your deployment platform (not in version control):

```bash
# Backend (container env)
DATABASE_URL=postgresql://...staging-db-host.../mosaic
REDIS_URL=redis://...staging-redis-host.../0
SUPABASE_JWT_SECRET=<staging project JWT secret>
SUPABASE_SERVICE_ROLE_KEY=<staging project service_role key>
ANTHROPIC_API_KEY=<shared or separate key>

# Web (Next.js build-time env)
NEXT_PUBLIC_SUPABASE_URL=https://<staging-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<staging key>
```

### Additional tests unlocked at staging

| # | Test | Steps | Expected |
|----|------|--------|----------|
| S1 | Real email verification | Register with a real email address | Receive verification email; click link; account activated |
| S2 | Password reset email | Request reset from real email | Receive reset email; link redirects to staging domain |
| S3 | Google OAuth full flow | Click "Sign in with Google" | Redirected to Google, back to staging; account created in Supabase |
| S4 | Facebook OAuth full flow | Click "Sign in with Facebook" | Redirected to Facebook, back to staging; account created |
| S5 | Apple Sign-In full flow | Click "Sign in with Apple" | Redirected to Apple, back to staging; account created; private relay email handled |
| S6 | Apple private relay email | Sign in with Apple using "Hide My Email" | App stores `@privaterelay.appleid.com` address; no overwrite attempted |
| S7 | Session expiry and refresh | Wait for JWT expiry (3600s) or force expiry; reload app | Middleware silently refreshes token via Supabase |
| S8 | Social account de-duplication | Sign in with Google once, then again | Single account; no duplicate created |
| S9 | Cross-device session | Log in on desktop, then mobile browser | Both sessions active; history visible on both |
| S10 | Load test guest limit | Simulate 100 concurrent guest users, each starting 6 chats | First 5 succeed; 6th returns `403 GUEST_LIMIT_REACHED`; no race condition |

### Resetting staging data

```bash
# Connect to staging DB (use your deployment platform's tunnel)
psql $STAGING_DATABASE_URL -c "TRUNCATE app_users, guest_sessions, conversations, debates CASCADE;"

# Or run a Supabase SQL editor command to clear auth.users (test accounts only)
# Note: use Supabase dashboard → Authentication → Users → select all → delete
```

---

## 3. Production Environment

Production uses a dedicated Supabase project and real infrastructure. The test strategy here shifts from manual exploration to **smoke tests** (verify the happy path works after each deploy) and **monitoring** (watch for error spikes).

### Infrastructure checklist before go-live

- [ ] Separate Supabase prod project (never the dev or staging project)
- [ ] `auth.users` row-level security policies reviewed
- [ ] `service_role` key stored in secrets manager (AWS Secrets Manager / Doppler), not env file
- [ ] Supabase SMTP configured with real transactional email sender (Sendgrid/SES)
- [ ] Email templates customised (verification, password reset, magic link)
- [ ] Google/Apple/Facebook OAuth apps configured with prod domain
- [ ] Apple: real domain verification file at `/.well-known/apple-app-site-association`
- [ ] Google Play: account deletion page live at `https://yourdomain.com/account-deletion` (required by Dec 2023 policy)
- [ ] Apple App Store: in-app deletion flow present (required since June 2022)
- [ ] Rate limiting values match production traffic expectations
- [ ] Database migrations run in a maintenance window with rollback plan
- [ ] Celery workers healthy (for async data export if upgraded from sync MVP)
- [ ] Logging/alerting configured for `401`, `403`, `429` spikes

### Post-deploy smoke tests

Run these immediately after every production deploy:

| # | Test | Steps | Pass Criteria |
|---|------|--------|---------------|
| P1 | Guest session | Visit site in incognito, click "Continue as Guest" | Feed loads; no console errors |
| P2 | Registration | Sign up with a test email alias (e.g. `you+test@gmail.com`) | Verification email received within 2 minutes |
| P3 | Login | Log in with verified credentials | Session established; profile page accessible |
| P4 | Social login (Google) | Click "Sign in with Google" in incognito | OAuth completes; account in Supabase Auth dashboard |
| P5 | Protected route redirect | Visit `/profile` while logged out | Redirected to `/auth/login?next=/profile` |
| P6 | API health | `GET https://api.yourdomain.com/health` | `{"status": "ok"}` |
| P7 | JWT rejection | `curl -H "Authorization: Bearer bad_token" /api/v1/profile/me` | `401 Unauthorized` |

### Monitoring signals to watch

| Signal | Tool | Alert threshold |
|--------|------|----------------|
| `POST /auth/login` 4xx rate | Datadog / CloudWatch | > 10% over 5-minute window |
| `POST /auth/register` 5xx rate | Same | Any 5xx |
| `429 Too Many Requests` rate | Same | Sustained > 1% (may indicate attack) |
| Supabase Auth error rate | Supabase dashboard → Logs → Auth | Any unexpected spike |
| JWT decode failures in FastAPI | Application logs | > 0.1% of requests |
| Data export failures | Application logs (`export_user_data`) | Any exception |
| Account deletion failures | Application logs (`delete_account`) | Any exception (GDPR risk) |

### Rollback plan for auth migration (007_add_user_accounts)

```bash
# If migration causes production issues, rollback:
cd backend && source venv/bin/activate
alembic downgrade -1   # Rolls back 007_add_user_accounts

# Note: this drops app_users, user_preferences, social_accounts, guest_sessions
# and removes user_id columns from conversations, debates, debate_turns.
# Any user data created after migration will be lost — only do this before users sign up.
```

---

## 4. What's Missing and Next Steps

The project has no automated test infrastructure yet. The testing above is all manual. Here's the recommended path to automate:

### Recommended test pyramid

```
         E2E (Playwright)          — 5–10 critical flows (L1–L14, S1–S10)
        ─────────────────────
      Integration (pytest)         — API endpoints with real test DB
    ─────────────────────────────
  Unit (pytest / vitest)           — services, JWT validation, schemas
─────────────────────────────────────
```

### Phase A: Backend integration tests (pytest)

All the dependencies are installed (`pytest` is not in requirements.txt yet — add it).

```bash
pip install pytest pytest-asyncio httpx
```

Key tests to write for this feature:
- `POST /auth/register` — valid, duplicate email, weak password
- `POST /auth/login` — valid, wrong password, unverified email
- `POST /auth/guest` → then `POST /api/v1/chat/{storyId}` 6 times → 6th returns 403
- `POST /auth/migrate-anonymous` — conversations reassigned
- `GET /profile/me` — authenticated vs unauthenticated
- `GET /profile/export` — ZIP structure valid
- `DELETE /profile/me` — debate turns anonymized; private data deleted

Use a separate test database (same schema, wiped between test runs):

```bash
# backend/.env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/mosaic_test
REDIS_URL=redis://localhost:6379/1   # Different Redis DB index
```

### Phase B: Frontend E2E tests (Playwright)

Playwright is already installed (`@playwright/test` in package.json). Add a config:

```typescript
// web/playwright.config.ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

Key E2E flows to automate (map directly to L1–L14):
- Guest → hit limit → sign-up prompt
- Register → verify → login → chat → logout → login → history intact
- Protected route redirects

### Phase C: CI/CD (GitHub Actions)

No `.github/workflows/` exists yet. A minimal auth CI pipeline:

```yaml
# .github/workflows/auth-tests.yml
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r backend/requirements.txt pytest pytest-asyncio httpx
      - run: alembic upgrade head
      - run: pytest backend/tests/

  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd web && npm ci && npm run lint
```

---

## Quick reference: which Supabase project for which environment

| You are working on... | Use this Supabase project |
|-----------------------|--------------------------|
| Local dev / feature branch | Your personal dev project (or a shared team dev project) |
| PR review / staging deploy | Dedicated staging project |
| Production | Dedicated production project |
| Running automated CI tests | A CI-specific project OR local Supabase CLI (`supabase start`) |

**Never reuse** a Supabase project across environments — JWT secrets, OAuth redirect URIs, and email senders must be isolated.
