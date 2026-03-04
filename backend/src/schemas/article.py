from datetime import datetime

from pydantic import BaseModel

from src.schemas.source import SourceRead


class ArticleBase(BaseModel):
    title: str
    url: str
    published_at: datetime | None = None
    snippet: str | None = None
    image_url: str | None = None


class ArticleRead(ArticleBase):
    id: int
    story_id: int
    source_id: int
    source: SourceRead | None = None

    model_config = {"from_attributes": True}
