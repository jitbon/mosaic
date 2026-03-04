# MosaicAI

A news aggregator that helps users understand media bias by showing Left/Center/Right coverage distribution for every story.

## Architecture

```
mosaic/
├── mobile/          # React Native + Expo (mobile app)
│   ├── app/         # Expo Router screens
│   ├── components/  # UI components (feed, story, common)
│   ├── hooks/       # Data fetching hooks (useFeed, useStory)
│   ├── services/    # API client, offline cache, background refresh
│   └── types/       # TypeScript interfaces
│
├── backend/         # FastAPI (Python API)
│   ├── src/
│   │   ├── api/     # REST endpoints (feed, story, refresh)
│   │   ├── models/  # SQLAlchemy models (Source, Story, Article)
│   │   ├── schemas/ # Pydantic schemas
│   │   ├── services/# Business logic (bias, clustering, ingestion, feed)
│   │   └── workers/ # Celery background tasks
│   ├── alembic/     # Database migrations
│   └── data/        # Bias ratings dataset
│
└── specs/           # Feature specifications and task tracking
```

## Features

- **Bias Coverage Bars** — Visual Left/Center/Right distribution for each story
- **Blindspot Detection** — Highlights stories covered by only one perspective (80%+ threshold)
- **Story Clustering** — Groups articles about the same event using sentence embeddings
- **Offline Support** — SQLite cache for instant load without network
- **Background Refresh** — Automatic feed updates via Celery + expo-task-manager

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, Expo, TypeScript |
| API | FastAPI, Python |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| Task Queue | Celery |
| ML | sentence-transformers (all-MiniLM-L6-v2) |
| Bias Data | AllSides Media Bias Ratings |
