# Quickstart: Web Frontend

**Feature**: 004-web-frontend | **Date**: 2026-03-04

## Prerequisites

- Node.js 22 LTS
- Python 3.11+ (for backend)
- PostgreSQL running with backend database seeded
- Backend `.env` configured

## Development Setup

```bash
# 1. Start the backend (terminal 1)
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# 2. Install and start the web frontend (terminal 2)
cd web
npm install
npm run dev
# → http://localhost:3000
# → API calls proxy to http://localhost:8000/api/v1/*
```

The Next.js dev server proxies all `/api/v1/*` requests to the FastAPI backend via `next.config.ts` rewrites.

## Production Build

```bash
# Build the static export
cd web
npm run build
# → outputs to web/out/

# Start FastAPI (serves both API and web frontend)
cd backend
uvicorn src.main:app --host 0.0.0.0 --port 8000
# → http://localhost:8000      (web frontend)
# → http://localhost:8000/api/v1/*  (API)
```

FastAPI mounts `web/out/` via `StaticFiles` at the root path. API routes (`/api/v1/*`) take priority.

## Key Commands

```bash
cd web

# Development
npm run dev              # Start dev server on :3000
npm run build            # Build static export to out/
npm run lint             # ESLint check
npm run format           # Prettier format

# Testing
npm run test             # Vitest unit/component tests
npm run test:watch       # Vitest in watch mode
npm run e2e              # Playwright E2E tests
npm run e2e:ui           # Playwright UI mode
```

## Environment Variables

```bash
# web/.env.local (development only)
NEXT_PUBLIC_API_BASE_URL=  # Leave empty — rewrites handle proxying in dev
```

No environment variables needed in production (static export uses relative paths).

## Theme

The Mosaic color theme is defined in `web/lib/theme.ts`, mirroring the mobile app's `mobile/constants/theme.ts`. CSS custom properties are set in `globals.css` and consumed by Tailwind classes.
