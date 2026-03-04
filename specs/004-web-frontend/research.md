# Research: Web Frontend

**Feature**: 004-web-frontend | **Date**: 2026-03-04

## R-001: Frontend Framework & Rendering Strategy

**Decision**: Next.js 15 with App Router, static export (`output: "export"`)

**Rationale**: The constitution mandates Next.js for web. App Router is the standard in 2026 (Pages Router deprecated). Static export is chosen because:
- The spec requires serving from the same backend server — static export avoids running a separate Node.js server
- All real-time features (chat/debate SSE) are client-side by nature (browser EventSource)
- FastAPI can mount the exported files via `StaticFiles(directory="web/out", html=True)`
- Simpler deployment: single process (uvicorn) serves both API and frontend

**Alternatives considered**:
- Full SSR (Next.js `start`): Requires Node.js server process alongside FastAPI. More complexity for no benefit since SSE must be client-side anyway.
- Nginx reverse proxy: Better for scale but spec assumes single-server deployment. Can upgrade later.
- Vite SPA: Simpler build, but constitution specifies Next.js.

## R-002: SSE Client Library

**Decision**: `@microsoft/fetch-event-source` for chat/debate streaming

**Rationale**: The chat endpoint (`POST /api/v1/chat/{story_id}/stream`) and debate round endpoint (`POST /api/v1/debate/{debate_id}/round`) use POST-based SSE. The native browser `EventSource` API only supports GET requests. `@microsoft/fetch-event-source` supports POST, custom headers, request bodies, and abort signals.

**Alternatives considered**:
- Native `EventSource`: GET-only, cannot send request body. Would require changing backend API contract.
- Custom `fetch` + `ReadableStream`: More code, less robust reconnection handling.
- `use-next-sse`: Thin wrapper, but less control over POST requests.

## R-003: CSS Framework

**Decision**: Tailwind CSS 4

**Rationale**: Provides utility-first styling that maps cleanly to the existing theme system. CSS custom properties (`--color-*`) will hold the Mosaic theme palette, consumed by Tailwind. Produces minimal CSS in production via purging.

**Alternatives considered**:
- CSS Modules: More verbose, harder to share theme tokens globally.
- Styled Components / Emotion: Runtime overhead, not ideal for static export.
- Plain CSS: No utility classes, slower development.

## R-004: Development Proxy

**Decision**: `next.config.ts` `rewrites` to proxy `/api/v1/*` to `http://127.0.0.1:8000`

**Rationale**: Built into Next.js, zero additional dependencies. Eliminates CORS during development. Same pattern used by the official Vercel Next.js + FastAPI starter template.

**Alternatives considered**:
- CORS headers (already configured on backend): Works but rewrites are cleaner for development parity with production.
- Separate proxy server (nginx/caddy): Overkill for dev environment.

## R-005: Production Integration

**Decision**: FastAPI `StaticFiles` mount serving `web/out/` at root path

**Rationale**: The spec explicitly requires the web interface at the root URL (`/`) of the backend server. Mounting the Next.js static export as the last route in FastAPI achieves this with zero infrastructure changes. API routes at `/api/v1/*` are matched first, everything else falls through to the static files.

**Implementation**:
```python
# backend/src/main.py (addition)
from fastapi.staticfiles import StaticFiles
from pathlib import Path

web_dir = Path(__file__).parent.parent.parent / "web" / "out"
if web_dir.exists():
    app.mount("/", StaticFiles(directory=str(web_dir), html=True), name="web")
```

**Alternatives considered**:
- Nginx reverse proxy: Better for scale, but adds infrastructure. Can upgrade later without frontend changes.
- Docker multi-stage build: Good for containerized deployments, orthogonal to this decision.

## R-006: Testing Strategy

**Decision**: Vitest + React Testing Library (unit/component), Playwright (E2E)

**Rationale**:
- Vitest: Native ESM support, faster than Jest, stable Browser Mode since v4.0 (Oct 2025). Works well with Next.js App Router.
- React Testing Library: Standard for component testing, tests user behavior not implementation.
- Playwright: True cross-browser testing (Chromium, Firefox, WebKit), better SSE stream testing support than Cypress, native parallelism.

**Alternatives considered**:
- Jest: Slower, ESM workarounds needed. Vitest is the modern standard.
- Cypress: Single-browser focus, weaker SSE support, slower execution.

## R-007: State Management

**Decision**: React hooks + `fetch` (no external state library)

**Rationale**: The app has simple data flows: fetch from API, display, stream SSE. No complex cross-component state. Custom hooks (`useFeed`, `useChat`, etc.) encapsulate data fetching logic, mirroring the mobile app's hook pattern. Adding React Query or Zustand would be premature — the app has ~5 data sources and no offline requirements.

**Alternatives considered**:
- TanStack React Query: Good for caching/deduplication, but adds dependency for simple fetch patterns. Can adopt later if pagination/caching needs grow.
- Zustand/Jotai: Overkill for this scope.
- React Context: Useful if we need shared state across deep component trees; can add per-feature as needed.
