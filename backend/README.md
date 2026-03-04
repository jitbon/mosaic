# MosaicAI Backend

FastAPI backend for article ingestion, clustering, and bias analysis.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GNEWS_API_KEY` | GNews API key for article fetching |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase API key |
| `REDIS_URL` | Redis connection URL |
| `DATABASE_URL` | PostgreSQL connection string (requires pgvector extension) |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI chat personas |
| `OPENAI_API_KEY` | OpenAI API key for text embeddings |

## Running

```bash
# API server
uvicorn src.main:app --reload

# Celery worker (for background ingestion)
celery -A src.workers.celery_app worker --loglevel=info

# Celery beat (for scheduled tasks)
celery -A src.workers.celery_app beat --loglevel=info
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/feed` | Get news feed (params: `limit`, `offset`, `filter`) |
| `GET` | `/api/v1/story/{id}` | Get story details with articles |
| `POST` | `/api/v1/refresh` | Trigger feed refresh |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/chat/{story_id}/stream` | Stream AI persona chat response (SSE) |
| `GET` | `/api/v1/chat/{story_id}/perspectives` | Check perspective availability |
| `GET` | `/api/v1/chat/{story_id}/conversations` | List conversations for a story |
| `GET` | `/api/v1/chat/conversations/{id}` | Get full conversation with messages |
| `DELETE` | `/api/v1/chat/conversations/{id}` | Delete a conversation |

### Chat Streaming (SSE)

`POST /api/v1/chat/{story_id}/stream` accepts `{ message, perspective, conversation_id? }` and returns server-sent events:

- `conversation_start` — New conversation created (includes `conversation_id`)
- `token` — Streamed text token
- `citation` — Resolved citation metadata
- `context_summarized` — Earlier messages were summarized
- `done` — Stream complete (includes `message_id`)
- `ended` — Conversation ended due to abuse threshold
- `error` — Error with `code` and `message`

Rate limit: 10 messages/min per story. Returns 429 with `Retry-After` header when exceeded.

## Database Migrations

```bash
alembic upgrade head    # Apply migrations
alembic downgrade -1    # Rollback last migration
```
