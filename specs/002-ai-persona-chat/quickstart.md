# Quickstart: AI Persona Chat

**Date**: 2026-03-04 | **Feature**: [spec.md](spec.md)

## Prerequisites

- Backend running (`uvicorn src.main:app --reload`)
- PostgreSQL with pgvector extension enabled
- Redis running
- Environment variables set:
  - `ANTHROPIC_API_KEY` — Claude API key for persona generation
  - `OPENAI_API_KEY` — OpenAI API key for text-embedding-3-small embeddings
  - Existing vars: `DATABASE_URL`, `REDIS_URL`, `SUPABASE_URL`, `SUPABASE_KEY`

## Integration Scenario 1: First Chat Message

**Flow**: User taps "Explore Perspectives" on story detail → selects "Left" → sends first message

1. Mobile calls `GET /api/v1/chat/{story_id}/perspectives` to check available perspectives
2. Mobile renders perspective selector with available/disabled states
3. User selects "Left" and types a message
4. Mobile opens SSE connection to `POST /api/v1/chat/{story_id}/stream` with `{message, perspective: "left", conversation_id: null}`
5. Backend creates new Conversation record
6. Backend retrieves relevant article chunks via pgvector (filtered by story_id + bias_label "left")
7. Backend builds system prompt with persona rules + RAG context
8. Backend streams Claude response as SSE events: `conversation_start` → N × `token` → `citation` → `done`
9. Mobile renders tokens in real-time, then displays citation cards
10. Mobile saves conversation + messages to local expo-sqlite

## Integration Scenario 2: Continue Conversation

1. Mobile loads existing conversation from local storage (or `GET /api/v1/chat/conversations/{id}`)
2. User sends follow-up message
3. Mobile sends `POST /api/v1/chat/{story_id}/stream` with existing `conversation_id`
4. Backend loads conversation history, checks `is_ended` flag
5. If conversation context > 3000 tokens: backend summarizes earlier messages, stores summary in `context_summary`
6. Backend builds prompt with: system prompt + context summary + recent messages + RAG chunks for user's question
7. Streams response as before

## Integration Scenario 3: Perspective Switch

1. User taps "Right" tab in perspective selector
2. Mobile checks if a conversation exists for this story + "right" perspective (local DB first, then API)
3. If exists: load and display existing thread
4. If not: show empty chat with persona introduction ready on first message
5. Previous "Left" conversation remains in local storage, accessible via tab switch

## Integration Scenario 4: Abuse Escalation

1. User sends abusive message
2. Backend detects via content moderation (system prompt instructs persona to redirect)
3. Backend increments `abuse_redirect_count` on conversation
4. Persona responds with redirection message
5. If `abuse_redirect_count >= 3`: backend sets `is_ended = true`, sends `ended` SSE event
6. Mobile shows end-of-conversation message, hides input bar, offers "Start new conversation" button

## New Dependencies

### Backend (pip)
- `anthropic` — Claude API SDK
- `openai` — OpenAI embeddings API
- `tiktoken` — Token counting for context management

### Mobile (npm)
- `react-native-sse` — SSE client for streaming
- `react-native-url-polyfill` — URL polyfill required by react-native-sse

## Key Files to Modify (Existing)

| File | Change |
| ---- | ------ |
| `backend/src/main.py` | Add chat router |
| `backend/requirements.txt` | Add anthropic, openai, tiktoken |
| `mobile/app/(tabs)/story/[id].tsx` | Add "Explore Perspectives" button |
| `mobile/constants/config.ts` | Add chat API endpoints |
| `mobile/package.json` | Add react-native-sse, react-native-url-polyfill |
