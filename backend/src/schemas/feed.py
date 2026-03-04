from pydantic import BaseModel

from src.schemas.story import StoryWithCoverage


class PaginationMeta(BaseModel):
    total: int
    limit: int
    offset: int
    has_more: bool


class FeedResponse(BaseModel):
    stories: list[StoryWithCoverage]
    pagination: PaginationMeta
