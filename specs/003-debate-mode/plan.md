# Implementation Plan: Multi-Persona Debate Mode

**Branch**: `003-debate-mode` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-debate-mode/spec.md`

## Summary

Add multi-persona debate mode to the story detail screen, allowing users to watch 2-3 AI personas (Left, Center, Right) debate a news topic in a structured turn-taking format. Personas auto-advance, respond directly to each other's arguments, and ground all claims in source articles via RAG. Completed turns collapse into expandable summaries to prevent scroll fatigue. Users can moderate by interjecting questions. Debates persist locally for review and resumption. Builds on the existing chat infrastructure (feature 002) with a new orchestration layer for multi-persona turn management.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x (mobile)
**Primary Dependencies**: FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite (all existing from feature 002)
**Storage**: PostgreSQL + pgvector (backend debate records), expo-sqlite (mobile local debate history)
**Testing**: pytest (backend), Jest + React Testing Library (mobile)
**Target Platform**: iOS/Android (React Native + Expo), Linux server (FastAPI)
**Project Type**: Mobile app + API backend
**Performance Goals**: First token < 5s per turn, 50 concurrent debates, auto-advance < 1s gap between turns
**Constraints**: Streaming SSE responses, 30-day local debate expiry, 2-3 personas per debate, 4-8 rounds typical
**Scale/Scope**: MVP — extends existing chat infrastructure, no new external dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation Notes |
|-----------|--------|---------------------|
| I. Understanding Over Persuasion | PASS | Debates show perspectives engaging with each other; user observes, not persuaded |
| II. Steel-Manning | PASS | Each persona's system prompt enforces steel-manning; personas must acknowledge valid opposing points |
| III. Source Grounding | PASS | Same RAG pipeline as chat; each persona retrieves perspective-specific article chunks |
| IV. Bias Transparency | PASS | Each turn shows inline citations with source bias labels; user sees which sources ground each perspective |
| V. Privacy & Data Minimization | PASS | Debates stored locally only; no tracking of user positions or preferences |
| VI. Moderation & Safety | PASS | Same abuse redirection as chat; personas refuse hate speech; AI disclaimers per turn |
| AI Ethics - False Personification | PASS | Personas identify as AI representations; no real names/photos |
| Performance | PASS | First token < 5s, auto-advance gap < 1s |
| Accessibility | PASS | WCAG 2.1 AA for debate UI; expandable/collapsible turns support screen readers |

**Gate result: PASS** — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-debate-mode/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── debate.py            # NEW: Debate model
│   │   └── debate_turn.py       # NEW: DebateTurn + ModeratorInterjection models
│   ├── schemas/
│   │   └── debate.py            # NEW: Debate request/response schemas
│   ├── services/
│   │   └── debate/
│   │       ├── debate_service.py      # NEW: Debate orchestration (turn management, context building)
│   │       ├── turn_manager.py        # NEW: Turn rotation, auto-advance sequencing
│   │       └── summary_service.py     # NEW: Turn summary generation for collapsed view
│   ├── api/v1/
│   │   └── debate.py           # NEW: Debate streaming + CRUD endpoints
│   └── main.py                 # MODIFY: Add debate router
├── alembic/versions/
│   └── 004_debate_tables.py    # NEW: Migration for debates + debate_turns
└── tests/
    └── ...

mobile/
├── app/(tabs)/
│   ├── story/[id].tsx          # MODIFY: Add "Start Debate" button alongside existing chat entry
│   └── debate/[storyId].tsx    # NEW: Debate screen
├── components/
│   └── debate/
│       ├── DebateView.tsx           # NEW: Main debate container (turn list + input)
│       ├── DebateTurn.tsx           # NEW: Single turn — collapsed summary or expanded full text
│       ├── DebatePersonaSelector.tsx # NEW: Multi-select persona picker (2-3 perspectives)
│       ├── ModeratorInput.tsx       # NEW: User interjection input bar
│       ├── TurnSummary.tsx          # NEW: Collapsed turn summary with expand toggle
│       └── DebateDisclaimer.tsx     # NEW: AI disclaimer for debate screen
├── hooks/
│   ├── useDebate.ts             # NEW: Debate state, turn management, auto-advance
│   └── useDebateHistory.ts      # NEW: Local debate persistence queries
├── services/
│   ├── debateApi.ts             # NEW: Debate API client (SSE streaming per turn)
│   └── debateStorage.ts         # NEW: expo-sqlite debate persistence
├── types/
│   └── debate.ts                # NEW: Debate TypeScript interfaces
└── constants/
    └── config.ts                # MODIFY: Add debate API endpoints
```

**Structure Decision**: Extends the existing backend + mobile structure from features 001/002. Debate functionality is a parallel module to chat — reuses persona_service, rag_service, and context_manager from chat but adds its own orchestration layer for multi-turn debate management. No new top-level directories needed.

## Complexity Tracking

> No violations — no entries needed.
