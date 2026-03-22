# Implementation Plan: API Token Efficiency & Prompt Optimization

**Branch**: `005-token-efficiency` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-token-efficiency/spec.md`

## Summary

Optimize Mosaic's AI API usage to reduce token costs by 40%+ while maintaining response quality. The approach has four incremental phases: (1) enable Anthropic prompt caching on stable system prompt prefixes, (2) replace the all-or-nothing context summarization with a sliding window + progressive summary strategy using accurate token counting, (3) add per-call usage tracking with reporting endpoints and configurable alerts, (4) pre-compute perspective summaries for popular stories to reduce RAG context size. All changes are backend-only, backward-compatible, and require no new infrastructure beyond existing PostgreSQL, Redis, and Celery.

## Technical Context

**Language/Version**: Python 3.11
**Primary Dependencies**: FastAPI 0.128.8, Anthropic SDK >=0.52.0, SQLAlchemy 2.0.48, Celery 5.6.2, Redis 7.0.1, Alembic 1.16.5
**Storage**: PostgreSQL (Supabase) with pgvector, Redis for caching
**Testing**: pytest (to be established — no test suite currently exists)
**Target Platform**: Linux server (Docker/cloud deployment)
**Project Type**: Web service (backend API)
**Performance Goals**: Persona generation within 5 seconds (constitution requirement), 40%+ input token cost reduction (SC-001), 60%+ cache hit rate (SC-002)
**Constraints**: No user-visible quality degradation, graceful fallback on cache miss, incremental rollout (P1→P2→P3→P4)
**Scale/Scope**: 1000 concurrent users (MVP target from constitution), backend-only changes across ~10 modified files and ~6 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Understanding Over Persuasion | ✅ PASS | Token optimization does not change AI behavior or content |
| II. Steel-Manning Requirement | ✅ PASS | Prompt restructuring preserves all persona rules verbatim; pre-computed summaries are generated with same RAG grounding |
| III. Source Grounding | ✅ PASS | RAG context is preserved in all optimization paths; pre-computed summaries retain source attribution |
| IV. Bias Transparency | ✅ PASS | No changes to bias display or source classification |
| V. Privacy & Data Minimization | ✅ PASS | Token usage records track system metrics (token counts, costs), not user content or preferences |
| VI. Moderation & Safety | ✅ PASS | Abuse detection and moderation logic unchanged |
| Performance & Reliability | ✅ PASS | Optimizations improve performance; fallbacks ensure no degradation |
| API & Integration | ✅ PASS | Uses existing Anthropic SDK caching features; no new external dependencies |

**Post-Phase 1 Re-check**: All gates still pass. Pre-computed summaries (P4) maintain source grounding by storing `source_article_ids` and `source_version_hash` to ensure summaries remain traceable to original articles. Context window sliding preserves recent messages verbatim, ensuring steel-manning rules and citation format are always present in the system prompt.

## Project Structure

### Documentation (this feature)

```text
specs/005-token-efficiency/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research decisions
├── data-model.md        # Phase 1: New and modified data models
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/
│   └── usage-api.md     # Phase 1: Admin API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── token_usage.py        # NEW: TokenUsage + TokenUsageDaily models
│   │   └── story_summary.py      # NEW: StorySummary model
│   ├── services/
│   │   ├── chat/
│   │   │   ├── chat_service.py       # MODIFIED: prompt caching, usage tracking
│   │   │   ├── persona_service.py    # MODIFIED: structured prompt blocks, pre-computed summary lookup
│   │   │   ├── context_manager.py    # MODIFIED: sliding window, accurate token counting
│   │   │   └── chunking_service.py   # MODIFIED: SDK-based token counting
│   │   ├── debate/
│   │   │   └── debate_service.py     # MODIFIED: prompt caching, usage tracking
│   │   ├── usage/
│   │   │   └── usage_service.py      # NEW: token tracking, aggregation, alerting
│   │   └── precompute/
│   │       └── summary_generator.py  # NEW: story summary pre-computation
│   ├── api/
│   │   └── v1/
│   │       └── admin.py              # NEW: usage reporting endpoints
│   ├── core/
│   │   └── config.py                 # MODIFIED: new settings for budgets, costs, alerts
│   └── workers/
│       └── tasks.py                  # MODIFIED: aggregation + pre-computation tasks
├── alembic/
│   └── versions/
│       ├── 005_token_usage_table.py      # NEW: migration
│       └── 006_story_summaries_table.py  # NEW: migration
└── tests/                                # NEW: test directory (if established)
```

**Structure Decision**: Backend-only changes following the existing project layout. New services organized under `services/usage/` and `services/precompute/`. New admin API under existing `api/v1/`. Two new Alembic migrations continuing the existing numbering sequence.

## Complexity Tracking

No constitution violations requiring justification. All changes use existing patterns and infrastructure.
