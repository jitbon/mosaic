import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from src.core.config import settings

logger = logging.getLogger("mosaic.gnews")

GNEWS_BASE_URL = "https://gnews.io/api/v4"
MAX_REQUESTS_PER_MINUTE = 10
_request_times: list[float] = []


async def _rate_limit():
    now = asyncio.get_event_loop().time()
    _request_times[:] = [t for t in _request_times if now - t < 60]
    if len(_request_times) >= MAX_REQUESTS_PER_MINUTE:
        wait_time = 60 - (now - _request_times[0])
        if wait_time > 0:
            logger.info("Rate limiting: waiting %.1f seconds", wait_time)
            await asyncio.sleep(wait_time)
    _request_times.append(asyncio.get_event_loop().time())


async def fetch_top_headlines(
    category: str = "general",
    language: str = "en",
    country: str = "us",
    max_results: int = 10,
) -> list[dict]:
    await _rate_limit()

    params = {
        "apikey": settings.gnews_api_key,
        "category": category,
        "lang": language,
        "country": country,
        "max": min(max_results, 100),
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(
                f"{GNEWS_BASE_URL}/top-headlines", params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get("articles", [])
        except httpx.HTTPStatusError as e:
            logger.error("GNews API error: %s", e.response.text)
            return []
        except httpx.RequestError as e:
            logger.error("GNews request error: %s", str(e))
            return []


async def search_articles(
    query: str,
    language: str = "en",
    max_results: int = 10,
    from_date: datetime | None = None,
) -> list[dict]:
    await _rate_limit()

    if from_date is None:
        from_date = datetime.now(timezone.utc) - timedelta(days=2)

    params = {
        "apikey": settings.gnews_api_key,
        "q": query,
        "lang": language,
        "max": min(max_results, 100),
        "from": from_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(f"{GNEWS_BASE_URL}/search", params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("articles", [])
        except httpx.HTTPStatusError as e:
            logger.error("GNews search error: %s", e.response.text)
            return []
        except httpx.RequestError as e:
            logger.error("GNews search request error: %s", str(e))
            return []
