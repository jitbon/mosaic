# MosaicAI

A news aggregator that helps users understand media bias by showing Left/Center/Right coverage distribution for every story. Chat with AI personas representing different political perspectives, or watch them debate each other.

## Architecture

```
mosaic/
├── web/             # Next.js 15 web frontend
│   ├── app/         # App Router pages (feed, story, chat, debate, history)
│   ├── components/  # UI components
│   ├── hooks/       # Data fetching hooks
│   ├── lib/         # API client, SSE streaming
│   └── types/       # TypeScript interfaces
│
├── mobile/          # React Native + Expo (mobile app)
│   ├── app/         # Expo Router screens
│   ├── components/  # UI components
│   ├── hooks/       # Data fetching hooks
│   └── types/       # TypeScript interfaces
│
├── backend/         # FastAPI (Python API)
│   ├── src/
│   │   ├── api/     # REST endpoints (feed, story, chat, debate)
│   │   ├── models/  # SQLAlchemy models
│   │   ├── schemas/ # Pydantic schemas
│   │   └── services/# Business logic (bias, clustering, ingestion, AI)
│   ├── alembic/     # Database migrations
│   └── data/        # Bias ratings dataset
│
└── specs/           # Feature specifications and task tracking
```

## Features

- **Bias Coverage Bars** — Visual Left/Center/Right distribution for each story
- **Blindspot Detection** — Highlights stories covered by only one perspective
- **AI Persona Chat** — Chat with Left, Center, or Right AI personas about any story
- **Debate Mode** — Watch AI personas debate each other with moderator interjections
- **Story Clustering** — Groups articles about the same event using sentence embeddings

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload
# → http://localhost:8000
```

### 2. Web (browser)

```bash
cd web
npm install
npm run dev
# → http://localhost:3000
```

The web dev server proxies `/api/*` to the backend at `http://localhost:8000` automatically.

### 3. Mobile (optional)

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 15, React 19, TypeScript |
| Mobile | React Native, Expo, TypeScript |
| API | FastAPI, Python 3.11 |
| AI | Anthropic Claude (SDK) |
| Database | PostgreSQL + pgvector |
| ML | sentence-transformers (all-MiniLM-L6-v2) |
| Bias Data | AllSides Media Bias Ratings |
