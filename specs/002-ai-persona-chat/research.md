# Research: AI Persona Chat

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Decision 1: LLM Provider & Streaming

**Decision**: Anthropic Claude API via `anthropic` Python SDK (AsyncAnthropic) with streaming

**Rationale**: Constitution mandates Claude API as primary LLM. The SDK provides `client.messages.stream()` with async iterator for text deltas, which maps directly to FastAPI `StreamingResponse` with SSE format.

**Key patterns**:
- Use `AsyncAnthropic` (not sync) in FastAPI async routes
- `stream.text_stream` yields raw text deltas
- SSE format: `data: {"type": "token", "text": "..."}\n\n`
- Event types: `token` (text delta), `citation` (source reference), `done` (stream complete), `error`
- Set `X-Accel-Buffering: no` header for Nginx compatibility
- Handle `anthropic.RateLimitError`, `APIConnectionError`, `APIStatusError` specifically

**Alternatives considered**: OpenAI GPT-4 (rejected — constitution mandates Claude), local LLM (rejected — quality requirements for steel-manning too high)

## Decision 2: RAG Implementation with pgvector

**Decision**: Chunk articles into ~300-400 token paragraphs, embed with OpenAI `text-embedding-3-small` (1536 dims), store in `article_chunks` table with pgvector, query filtered by `story_id` + `bias_label`

**Rationale**: Constitution mandates OpenAI text-embedding-3-small. Existing `all-MiniLM-L6-v2` used for clustering serves a different purpose. Per-perspective retrieval ensures persona grounding integrity.

**Key patterns**:
- New `article_chunks` table: `id, article_id, story_id, bias_label, chunk_index, content, embedding vector(1536), metadata jsonb`
- IVFFlat index on embedding column
- Query: filter by `story_id` AND `bias_label`, then cosine similarity, LIMIT 16, re-rank to 8
- Bias mapping: Left persona ← `left` sources only; Center ← `center-left, center, center-right`; Right ← `right` only
- Embed `"{story_headline}. {user_question}"` for retrieval query
- Max 2 chunks per article (diversity re-ranking), 8 chunks total per persona
- Format as numbered reference list `[1]`, `[2]` in system prompt for citation anchoring
- Chunk at paragraph boundaries, not fixed tokens; prepend article title + source name to each chunk

**Alternatives considered**: Full article injection (rejected — too many tokens, poor precision), external vector DB like Pinecone (rejected — pgvector already in stack via Supabase)

## Decision 3: Mobile SSE Consumption

**Decision**: Use `react-native-sse` library with `requestAnimationFrame` buffer for smooth token rendering

**Rationale**: Works with Expo 49+, supports custom headers, TypeScript typed, auto-reconnects. Buffer pattern prevents excessive re-renders (batch tokens at 60fps).

**Key patterns**:
- `npm install react-native-sse react-native-url-polyfill`
- Custom `useChat` hook: manages SSE connection, buffers tokens via RAF, exposes `text`, `isStreaming`, `error`, `start`, `stop`
- Parse SSE `data` field as JSON, extract by event type (`token`, `citation`, `done`, `error`)
- On connection drop: exponential backoff reconnect (1s, 2s, 4s, 8s, 16s)
- Expo gotcha: CdpInterceptor can block SSE in debug builds on Expo ≤50; test in release mode or upgrade to Expo 52+

**Alternatives considered**: `@falcondev-oss/expo-event-source-polyfill` (better for Expo 52+ but needs version check), raw fetch + getReader (too much boilerplate)

## Decision 4: Conversation Persistence

**Decision**: expo-sqlite for local chat storage with 30-day auto-expiry

**Rationale**: Already using expo-sqlite for offline feed cache (feature 001). Chat history follows the same pattern — local-first, no auth needed. 30-day expiry per clarification session.

**Key patterns**:
- Tables: `conversations` (id, story_id, perspective, created_at, updated_at), `messages` (id, conversation_id, role, content, citations_json, timestamp)
- On app launch: delete conversations where `updated_at < now - 30 days`
- User can swipe-to-delete individual conversations
- No server-side persistence for MVP

**Alternatives considered**: AsyncStorage (rejected — not suited for structured queries), server-side storage (rejected — deferred to post-MVP per spec)

## Decision 5: Persona System Prompts

**Decision**: Template-based system prompts with perspective-specific behavioral rules + RAG context injection

**Rationale**: System prompts enforce constitution requirements (steel-manning, AI disclosure, citation, moderation). Template allows consistent behavior across perspectives while varying the grounding sources.

**Key patterns**:
- System prompt structure: AI identity disclosure → perspective role → behavioral rules (steel-man, citation format, off-topic redirect, abuse handling) → RAG source material → conversation history summary (if applicable)
- Abuse counter: track consecutive redirections in conversation state; after 3, return end-conversation message
- Off-topic: system prompt instructs redirect to story context
- Context summarization: when conversation exceeds ~3000 tokens of history, summarize earlier turns via a separate Claude call

**Alternatives considered**: Fine-tuned model per perspective (rejected — unnecessary complexity, prompt engineering sufficient), single prompt with perspective parameter (rejected — behavioral nuance needs per-perspective templates)

## Decision 6: Backend Chat API Design

**Decision**: POST `/api/v1/chat/{story_id}/stream` with SSE response; separate endpoints for conversation CRUD

**Rationale**: Streaming endpoint handles real-time chat; REST endpoints manage conversation lifecycle. story_id in URL path keeps routing clean.

**Key endpoints**:
- `POST /api/v1/chat/{story_id}/stream` — Send message, get streaming response (SSE)
- `GET /api/v1/chat/{story_id}/conversations` — List conversations for a story
- `GET /api/v1/chat/conversations/{conversation_id}` — Get conversation with messages
- `DELETE /api/v1/chat/conversations/{conversation_id}` — Delete conversation

**Alternatives considered**: WebSocket (rejected — SSE simpler for unidirectional streaming, no need for bidirectional), GraphQL subscriptions (rejected — overkill for MVP)
