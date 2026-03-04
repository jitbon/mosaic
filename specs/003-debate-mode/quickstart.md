# Quickstart: Multi-Persona Debate Mode

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Prerequisites

- Backend running (`uvicorn src.main:app --reload`)
- PostgreSQL with pgvector extension enabled
- Redis running
- Feature 002 (AI Persona Chat) fully deployed — debate reuses persona, RAG, and context services
- Environment variables set:
  - `ANTHROPIC_API_KEY` — Claude API key for persona generation
  - `OPENAI_API_KEY` — OpenAI API key for embeddings
  - Existing vars: `DATABASE_URL`, `REDIS_URL`

## Integration Scenario 1: Start a Two-Persona Debate

**Flow**: User taps "Start Debate" on story detail → selects Left and Right → watches debate unfold

1. Mobile calls `GET /api/v1/chat/{story_id}/perspectives` (existing endpoint) to check available perspectives
2. Mobile renders persona multi-selector with available/disabled states
3. User selects Left and Right, taps "Start"
4. Mobile calls `POST /api/v1/debate/{story_id}/start` with `{"personas": ["left", "right"]}`
5. Backend creates Debate record, returns debate_id
6. Mobile opens SSE connection to `POST /api/v1/debate/{debate_id}/round`
7. Backend generates Left persona turn:
   - Retrieves RAG chunks (story_id + bias_label "left")
   - Builds system prompt with debate rules + RAG context
   - Streams Claude response → SSE events: `turn_start` → N × `token` → `citation` → `turn_summary` → `turn_complete`
8. Mobile renders Left turn in real-time, then collapses to summary
9. Backend auto-advances to Right persona turn:
   - Includes Left's full response in debate context
   - Retrieves RAG chunks (bias_label "right")
   - Streams response → same SSE event sequence
10. Mobile renders Right turn, collapses previous Left turn to summary
11. Backend emits `round_complete`
12. Mobile saves debate + turns to local expo-sqlite

## Integration Scenario 2: User Moderates the Debate

1. After round 1 completes, user types a question in the moderator input
2. Mobile calls `POST /api/v1/debate/{debate_id}/interject` with `{"message": "...", "directed_at": null}`
3. Backend stores interjection as a DebateTurn with role "moderator"
4. Mobile requests next round: `POST /api/v1/debate/{debate_id}/round`
5. Backend includes moderator's interjection in both personas' context
6. Each persona addresses the user's question in their next turn before continuing the debate

## Integration Scenario 3: Three-Way Debate

1. User selects Left, Center, and Right
2. `POST /api/v1/debate/{story_id}/start` with `{"personas": ["left", "center", "right"]}`
3. Each round has 3 turns in rotation: Left → Center → Right
4. Each persona sees all previous turns (from all perspectives) in their context
5. Center persona uses center/center-left/center-right sources via existing bias mapping

## Integration Scenario 4: Resume Past Debate

1. User opens debate history screen
2. Mobile queries local expo-sqlite for past debates
3. User taps on a debate → mobile renders stored turns (collapsed with summaries)
4. User taps "Resume" → mobile calls `POST /api/v1/debate/{debate_id}/round`
5. Backend rebuilds context from stored turns + context_summary
6. Debate continues with new round

## Integration Scenario 5: Collapsible Turn Summaries

1. During streaming, full turn text is displayed in real-time
2. After `turn_summary` SSE event, the turn collapses to: `[Left] Argues that the policy advances economic equity based on Guardian analysis.`
3. User taps collapsed turn → expands inline to show full text with citations
4. User taps again → collapses back to summary
5. The currently streaming turn is always expanded; all previous turns are collapsed

## New Dependencies

None — debate mode reuses all existing dependencies from features 001 and 002.

## Key Files to Modify (Existing)

| File | Change |
| ---- | ------ |
| `backend/src/main.py` | Add debate router |
| `mobile/app/(tabs)/story/[id].tsx` | Add "Start Debate" button |
| `mobile/constants/config.ts` | Add debate API endpoints |
