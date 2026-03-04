# mosaic Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-04

## Active Technologies
- Python 3.11 (backend), TypeScript 5.x (mobile) + FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite (002-ai-persona-chat)
- PostgreSQL + pgvector (backend), expo-sqlite (mobile local chat history) (002-ai-persona-chat)
- Python 3.11 (backend), TypeScript 5.x (mobile) + FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite (all existing from feature 002) (003-debate-mode)
- PostgreSQL + pgvector (backend debate records), expo-sqlite (mobile local debate history) (003-debate-mode)
- TypeScript 5.x, Node.js 22 LTS + Next.js 15 (App Router, static export), React 19, `@microsoft/fetch-event-source` (POST-based SSE), Tailwind CSS 4 (004-web-frontend)
- N/A (all data from backend API; no browser-local storage) (004-web-frontend)

- (001-biased-news-feed)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for

## Code Style

: Follow standard conventions

## Recent Changes
- 004-web-frontend: Added TypeScript 5.x, Node.js 22 LTS + Next.js 15 (App Router, static export), React 19, `@microsoft/fetch-event-source` (POST-based SSE), Tailwind CSS 4
- 003-debate-mode: Added Python 3.11 (backend), TypeScript 5.x (mobile) + FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite (all existing from feature 002)
- 002-ai-persona-chat: Added Python 3.11 (backend), TypeScript 5.x (mobile) + FastAPI, Anthropic Claude SDK, SQLAlchemy, React Native + Expo, expo-sqlite


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
