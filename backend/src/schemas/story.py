from datetime import datetime

from pydantic import BaseModel

from src.schemas.article import ArticleRead


class StoryBase(BaseModel):
    headline: str
    summary: str | None = None
    published_at: datetime


class StoryRead(StoryBase):
    id: int
    left_count: int
    center_count: int
    right_count: int
    is_blindspot: bool
    blindspot_perspective: str | None = None

    model_config = {"from_attributes": True}


class StoryWithCoverage(StoryRead):
    total_coverage: int = 0
    image_url: str | None = None


class StoryDetailResponse(StoryRead):
    articles: list[ArticleRead] = []
