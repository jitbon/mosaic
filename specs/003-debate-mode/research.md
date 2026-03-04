# Research: Multi-Persona Debate Mode

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Decision 1: Debate Orchestration Architecture

**Decision**: Sequential turn orchestration via a backend debate_service that chains persona responses — each turn includes the full debate context (previous turns + RAG) in the system prompt, then streams the response to the client. The backend manages turn order and auto-triggers the next persona.

**Rationale**: The debate requires each persona to directly respond to the previous persona's arguments. This means the backend must wait for one persona's full response before generating the next. A sequential streaming approach (stream turn N to client → complete → build context for turn N+1 → stream to client) is the simplest architecture that achieves the "auto-advance" UX. The client opens a single long-lived SSE connection per debate round, receiving all persona turns in sequence.

**Key patterns**:
- Client sends `POST /api/v1/debate/{story_id}/round` to start or continue a debate
- Backend streams Turn 1 (persona A) → emits `turn_complete` → streams Turn 2 (persona B) → emits `turn_complete` → [Turn 3 if 3 personas] → emits `round_complete`
- Each turn's response is appended to the debate context before generating the next
- Client can interrupt auto-advance by sending a moderator interjection (via a separate `POST /api/v1/debate/{debate_id}/interject`)
- Turn summaries generated inline by including a `summary:` instruction in the persona system prompt (no extra LLM call)

**Alternatives considered**:
- Parallel persona generation (rejected — personas can't respond to each other without sequential context)
- Client-side orchestration with multiple SSE connections (rejected — adds complexity, latency from round-trips)
- WebSocket for bidirectional debate control (rejected — SSE sufficient; moderation handled via separate REST call)

## Decision 2: Reuse of Chat Infrastructure

**Decision**: Reuse `persona_service.py`, `rag_service.py`, and `context_manager.py` from feature 002's chat module. Create a new `debate_service.py` that composes these services with debate-specific orchestration.

**Rationale**: The core building blocks are identical — persona system prompts, RAG retrieval per perspective, and context summarization. The only new logic is multi-persona turn management and cross-persona context building. Reuse avoids duplication and ensures constitutional compliance carries over.

**Key patterns**:
- `debate_service.py` imports and calls `persona_service.build_system_prompt()` for each persona
- `debate_service.py` calls `rag_service.retrieve_chunks()` per perspective per round (cache across turns in same round)
- Context includes: system prompt (per persona) + debate history (all previous turns from all personas) + RAG chunks (perspective-specific)
- Turn summary: persona system prompt includes instruction to end response with `[SUMMARY: <1-2 sentence summary>]` — parsed by backend, stored in turn record, sent as separate SSE event

**Alternatives considered**: Fork/copy chat services (rejected — DRY violation, doubles maintenance burden), abstract base class for chat vs debate (rejected — composition simpler than inheritance here)

## Decision 3: Turn Summary Generation

**Decision**: Inline summary via system prompt instruction — each persona ends its response with a bracketed summary that the backend parses and strips before display. No separate LLM call needed.

**Rationale**: An extra LLM call per turn would add 2-5s latency and double API costs. The persona is already the best summarizer of its own argument since it just wrote it. The `[SUMMARY: ...]` marker is reliable and easy to parse.

**Key patterns**:
- System prompt includes: "End your response with [SUMMARY: A 1-2 sentence summary of your key argument]"
- Backend streams all tokens to client, but after stream completes, parses `[SUMMARY: ...]` from the full text
- Backend emits `turn_summary` SSE event with the extracted summary
- Client shows full text during streaming, then collapses to summary after `turn_summary` event
- If persona fails to include summary (edge case), backend falls back to first sentence of response

**Alternatives considered**: Separate Claude call for summarization (rejected — latency + cost), client-side summarization (rejected — no LLM on client), fixed-length truncation (rejected — loses meaning)

## Decision 4: Debate Data Model

**Decision**: New `debates` and `debate_turns` tables in PostgreSQL, separate from the existing `conversations` and `messages` tables. Mobile mirrors with local expo-sqlite tables.

**Rationale**: Debates have fundamentally different structure than chats — multiple personas per session, structured turn rotation, turn summaries, moderator interjections as a distinct role. Sharing the conversation/message tables would require overloading fields and adding confusing nullable columns. Clean separation is simpler and maps directly to the spec entities.

**Key patterns**:
- `debates` table: id, story_id, personas (JSONB array of perspectives), status (active/paused/completed), current_round, abuse_redirect_count, context_summary, created_at, updated_at
- `debate_turns` table: id, debate_id, turn_number, role (persona_left/persona_center/persona_right/moderator), content, summary, citations (JSONB), created_at
- Single table for both persona turns and moderator interjections (differentiated by role)
- Local expo-sqlite mirrors the same structure

**Alternatives considered**: Extend conversation/message tables (rejected — schema pollution), single denormalized debate document in JSONB (rejected — can't efficiently query individual turns)

## Decision 5: Auto-Advance + Moderation Interruption

**Decision**: Auto-advance is managed server-side within a single SSE connection per round. Moderator interjections are sent via a separate REST endpoint that signals the debate_service to include the interjection in the next turn's context.

**Rationale**: Server-side auto-advance ensures consistent turn ordering and eliminates client-side race conditions. The moderation REST endpoint is simple (just stores the interjection) and the next persona turn picks it up naturally.

**Key patterns**:
- `POST /api/v1/debate/{story_id}/round` — opens SSE stream, backend generates all persona turns for the round sequentially
- `POST /api/v1/debate/{debate_id}/interject` — stores interjection, signals current round to include it in next turn's context
- If interjection arrives while a turn is streaming, it's queued for the next turn
- If interjection arrives between turns, the next persona addresses it immediately
- Between rounds (after all personas have spoken), client can either interject or request next round
- SSE events per round: N × (`turn_start` → tokens → `turn_summary` → `turn_complete`) → `round_complete`

**Alternatives considered**: Client triggers each turn individually (rejected — adds latency from round-trips, breaks auto-advance feel), WebSocket for real-time interruption (rejected — SSE + REST is sufficient and simpler)

## Decision 6: Debate API Design

**Decision**: New `/api/v1/debate/` endpoint group, parallel to `/api/v1/chat/`, with streaming round endpoint and CRUD for debate management.

**Rationale**: Clean separation from chat API. Debate has different semantics (rounds, multiple personas, interjections) that don't map to the chat endpoint signatures.

**Key endpoints**:
- `POST /api/v1/debate/{story_id}/start` — Create debate, select personas, get debate_id
- `POST /api/v1/debate/{debate_id}/round` — Stream next round (all persona turns)
- `POST /api/v1/debate/{debate_id}/interject` — Submit moderator interjection
- `GET /api/v1/debate/{story_id}/debates` — List debates for a story
- `GET /api/v1/debate/{debate_id}` — Get debate with all turns
- `DELETE /api/v1/debate/{debate_id}` — Delete debate

**Alternatives considered**: Extend chat endpoints with `mode=debate` parameter (rejected — different request/response shapes, cluttered API), single endpoint handling everything (rejected — violates REST principles)
