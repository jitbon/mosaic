from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.cache import cache_get, cache_set
from src.core.config import settings
from src.core.database import get_db
from src.schemas.story import StoryDetailResponse
from src.services.feed.feed_service import get_story_detail

router = APIRouter()


@router.get("/story/{story_id}", response_model=StoryDetailResponse)
def story_detail(
    story_id: int,
    db: Session = Depends(get_db),
):
    cache_key = f"story:{story_id}"
    cached = cache_get(cache_key)
    if cached:
        return StoryDetailResponse(**cached)

    result = get_story_detail(db, story_id)
    if not result:
        raise HTTPException(status_code=404, detail="Story not found")

    cache_set(cache_key, result.model_dump(), ttl=settings.story_cache_ttl)
    return result
