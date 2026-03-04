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
| `DATABASE_URL` | PostgreSQL connection string |

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

## Database Migrations

```bash
alembic upgrade head    # Apply migrations
alembic downgrade -1    # Rollback last migration
```
