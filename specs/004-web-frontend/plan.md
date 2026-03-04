# Implementation Plan: Web Frontend

**Branch**: `004-web-frontend` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-web-frontend/spec.md`

## Summary

Build a Next.js web frontend served from the existing FastAPI backend as a static export. The app provides a bottom navigation bar (Feed, Chats, Debates), a news feed home screen with bias indicators and filtering, story detail views with source grouping, AI perspective chat with SSE streaming, and multi-persona debate viewing. The frontend consumes all existing `/api/v1/*` endpoints with no backend changes. History is fetched from the backend API (no browser-local storage).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22 LTS
**Primary Dependencies**: Next.js 15 (App Router, static export), React 19, `@microsoft/fetch-event-source` (POST-based SSE), Tailwind CSS 4
**Storage**: N/A (all data from backend API; no browser-local storage)
**Testing**: Vitest + React Testing Library (unit/component), Playwright (E2E)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge), 375px–1440px+ responsive
**Project Type**: Web SPA (static export served by FastAPI)
**Performance Goals**: Feed loads <2s, navigation <300ms, SSE stream starts <2s
**Constraints**: Single-server deployment (FastAPI serves static files at `/`), no Node.js server in production
**Scale/Scope**: ~15 pages/components, 5 API integrations, 2 SSE streaming flows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Understanding Over Persuasion | PASS | Frontend displays perspectives without favoring any; no engagement optimization |
| II. Steel-Manning Requirement | PASS | Frontend renders AI responses as-is; no client-side modification of persona output |
| III. Source Grounding | PASS | Citations displayed with source attribution; links to original articles |
| IV. Bias Transparency | PASS | Bias bar on feed cards, perspective grouping on story detail, blindspot badge |
| V. Privacy & Data Minimization | PASS | No local storage, no tracking, no cookies, no analytics |
| VI. Moderation & Safety | PASS | AI disclaimers on chat/debate screens; send button disabled during streaming |
| Accessibility (WCAG 2.1 AA) | PASS | Semantic HTML, ARIA labels, keyboard navigation, color contrast checked |
| Tech Stack (Next.js for web) | PASS | Using Next.js as specified in constitution |
| Mobile-First Design | PASS | Responsive from 375px; bottom nav mirrors mobile app |

**Gate result**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-web-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ui-contracts.md  # Component contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py          # Add StaticFiles mount for web/out
│   └── api/v1/          # Existing API (no changes)
└── tests/

web/                     # NEW — Next.js app
├── app/
│   ├── layout.tsx       # Root layout with bottom nav
│   ├── page.tsx         # Feed (home screen)
│   ├── story/
│   │   └── [id]/
│   │       └── page.tsx # Story detail
│   ├── chat/
│   │   └── [storyId]/
│   │       └── page.tsx # Chat interface
│   ├── debate/
│   │   └── [storyId]/
│   │       └── page.tsx # Debate interface
│   ├── history/
│   │   └── page.tsx     # Chat & Debate history
│   └── globals.css      # Tailwind + theme variables
├── components/
│   ├── nav/
│   │   └── BottomNav.tsx
│   ├── feed/
│   │   ├── StoryCard.tsx
│   │   ├── BiasBar.tsx
│   │   ├── BlindspotBadge.tsx
│   │   └── FilterButtons.tsx
│   ├── story/
│   │   ├── StoryHeader.tsx
│   │   └── SourceList.tsx
│   ├── chat/
│   │   ├── ChatBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── PerspectiveSelector.tsx
│   │   ├── StreamingText.tsx
│   │   └── CitationCard.tsx
│   ├── debate/
│   │   ├── DebateView.tsx
│   │   ├── DebateTurn.tsx
│   │   ├── DebatePersonaSelector.tsx
│   │   └── ModeratorInput.tsx
│   └── common/
│       ├── ErrorBanner.tsx
│       └── LoadingSkeleton.tsx
├── lib/
│   ├── api.ts           # Fetch wrapper for /api/v1/*
│   ├── sse.ts           # SSE streaming helpers
│   └── theme.ts         # Theme colors (reuse from mobile)
├── hooks/
│   ├── useFeed.ts
│   ├── useStory.ts
│   ├── useChat.ts
│   ├── useDebate.ts
│   └── useChatHistory.ts
├── types/
│   ├── feed.ts
│   ├── story.ts
│   ├── chat.ts
│   └── debate.ts
├── __tests__/
│   ├── components/
│   └── hooks/
├── e2e/
│   └── feed.spec.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts
```

**Structure Decision**: New `web/` directory at repository root alongside existing `backend/` and `mobile/`. In production, `next build` outputs to `web/out/` which FastAPI mounts via `StaticFiles(directory="web/out", html=True)` at the root path. During development, Next.js dev server runs on port 3000 with rewrites proxying `/api/v1/*` to FastAPI on port 8000.

## Complexity Tracking

No constitution violations to justify. The architecture is straightforward: static export + FastAPI mount, no SSR server, no additional infrastructure.
