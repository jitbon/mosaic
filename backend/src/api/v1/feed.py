from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.core.cache import cache_get, cache_set
from src.core.config import settings
from src.core.database import get_db
from src.schemas.feed import FeedResponse
from src.services.feed.feed_service import get_feed

router = APIRouter()


@router.get("/feed", response_model=FeedResponse)
def feed(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    filter: str = Query(default="all", regex="^(all|blindspot|balanced)$"),
    db: Session = Depends(get_db),
):
    cache_key = f"feed:{filter}:{offset}:{limit}"
    cached = cache_get(cache_key)
    if cached:
        return JSONResponse(
            content=cached,
            headers={"Cache-Control": "public, max-age=300"},
        )

    result = get_feed(db, limit=limit, offset=offset, filter_type=filter)
    data = result.model_dump(mode="json")
    cache_set(cache_key, data, ttl=settings.feed_cache_ttl)
    return JSONResponse(
        content=data,
        headers={"Cache-Control": "public, max-age=300"},
    )
