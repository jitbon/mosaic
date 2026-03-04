# Implementation Plan: AI Persona Chat

**Branch**: `002-ai-persona-chat` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-ai-persona-chat/spec.md`

## Summary

Add AI persona chat to the story detail screen, allowing users to converse with Left, Center, and Right AI personas grounded in source articles via RAG. Responses stream token-by-token using the Claude API, with inline citations, perspective switching, and local conversation persistence.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x (mobile)
**Primary Dependencies**: FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite
**Storage**: PostgreSQL + pgvector (backend), expo-sqlite (mobile local chat history)
**Testing**: pytest (backend), Jest + React Testing Library (mobile)
**Target Platform**: iOS/Android (React Native + Expo), Linux server (FastAPI)
**Project Type**: Mobile app + API backend
**Performance Goals**: First token < 5s, perspective switch < 2s, 100 concurrent chat sessions
**Constraints**: Streaming SSE responses, 30-day local chat expiry, offline story data (not chat)
**Scale/Scope**: MVP — single-user local chat, no auth required for chat

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation Notes |
|-----------|--------|---------------------|
| I. Understanding Over Persuasion | PASS | Personas educate, don't persuade; steel-man enforced via system prompts |
| II. Steel-Manning | PASS | System prompts enforce strongest version of each perspective |
| III. Source Grounding | PASS | RAG mandatory; all claims cite source articles from story |
| IV. Bias Transparency | PASS | Citations show source name + bias rating; disabled perspectives labeled |
| V. Privacy & Data Minimization | PASS | Chat stored locally only; no tracking of political leanings |
| VI. Moderation & Safety | PASS | Hate speech redirection with 3-strike conversation end; AI disclaimers |
| AI Ethics - False Personification | PASS | Personas identify as AI; no real names/photos |
| Performance | PASS | First token < 5s via streaming; perspective switch < 2s |
| Accessibility | PASS | WCAG 2.1 AA for chat UI |

**Gate result: PASS** — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-persona-chat/
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
│   │   ├── story.py          # Existing
│   │   ├── article.py        # Existing
│   │   ├── source.py         # Existing
│   │   ├── conversation.py   # NEW: Chat conversation model
│   │   └── message.py        # NEW: Chat message model
│   ├── schemas/
│   │   ├── chat.py           # NEW: Chat request/response schemas
│   │   └── ...               # Existing schemas
│   ├── services/
│   │   ├── chat/
│   │   │   ├── persona_service.py    # NEW: Persona system prompt builder
│   │   │   ├── chat_service.py       # NEW: Chat orchestration + RAG
│   │   │   └── context_manager.py    # NEW: Conversation context/summarization
│   │   └── ...               # Existing services
│   ├── api/v1/
│   │   ├── chat.py           # NEW: Chat streaming endpoint
│   │   └── ...               # Existing endpoints
│   └── main.py               # Add chat router
├── alembic/versions/
│   └── 003_chat_tables.py    # NEW: Migration for conversations + messages
└── tests/
    └── ...

mobile/
├── app/
│   ├── (tabs)/
│   │   ├── story/[id].tsx    # MODIFY: Add chat entry point
│   │   └── chat/[storyId].tsx # NEW: Chat screen
│   └── ...
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx         # NEW: Message bubble with citations
│   │   ├── ChatInput.tsx          # NEW: Message input bar
│   │   ├── PerspectiveSelector.tsx # NEW: L/C/R tab selector
│   │   ├── CitationCard.tsx       # NEW: Expandable citation detail
│   │   ├── StreamingText.tsx      # NEW: Token-by-token text renderer
│   │   └── ChatDisclaimer.tsx     # NEW: AI disclaimer banner
│   └── ...
├── hooks/
│   ├── useChat.ts            # NEW: Chat state + streaming
│   ├── useChatHistory.ts     # NEW: Local conversation persistence
│   └── ...
├── services/
│   ├── chatApi.ts            # NEW: Chat API client (SSE streaming)
│   ├── chatStorage.ts        # NEW: expo-sqlite chat persistence
│   └── ...
├── types/
│   ├── chat.ts               # NEW: Chat TypeScript interfaces
│   └── ...
└── constants/
    └── config.ts             # MODIFY: Add chat endpoints + config
```

**Structure Decision**: Extends the existing backend + mobile structure established in feature 001. New chat functionality added as new modules within existing directories. No new top-level directories needed.

## Complexity Tracking

> No violations — no entries needed.
