import asyncio
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.core.cache import cache_delete_pattern
from src.core.database import get_db
from src.services.ingestion.ingestion_service import ingest_articles

router = APIRouter()

# Simple in-memory rate limiter
_rate_limits: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 5  # requests per minute


def _check_rate_limit(client_ip: str):
    now = time.time()
    _rate_limits[client_ip] = [
        t for t in _rate_limits[client_ip] if now - t < 60
    ]
    if len(_rate_limits[client_ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Max 5 refreshes per minute.",
        )
    _rate_limits[client_ip].append(now)


@router.post("/refresh")
async def refresh_feed(
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    result = await ingest_articles(db)

    # Invalidate feed cache
    cache_delete_pattern("feed:*")

    return {
        "new_stories_count": result["new_stories"],
        "updated_stories_count": 0,
        "message": "Feed refreshed successfully",
    }
