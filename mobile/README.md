# MosaicAI Mobile

React Native + Expo mobile app for the MosaicAI news feed.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with your API URL
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (default: `http://localhost:8000`) |

## Running

```bash
npm run start    # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
npm run web      # Run in browser
```

## Architecture

- **Expo Router** — File-based routing (`app/` directory)
- **TanStack Query** — Data fetching with caching and stale-while-revalidate
- **FlashList** — Virtualized list for feed performance
- **expo-sqlite** — Offline cache for instant load
- **expo-image** — Optimized image loading with transitions
