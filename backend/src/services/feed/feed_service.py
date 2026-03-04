import logging

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from src.models.article import Article
from src.models.story import Story
from src.schemas.feed import FeedResponse, PaginationMeta
from src.schemas.story import StoryDetailResponse, StoryWithCoverage

logger = logging.getLogger("mosaic.feed")


def get_feed(
    db: Session,
    limit: int = 20,
    offset: int = 0,
    filter_type: str = "all",
) -> FeedResponse:
    query = db.query(Story)

    if filter_type == "blindspot":
        query = query.filter(Story.is_blindspot.is_(True))
    elif filter_type == "balanced":
        query = query.filter(Story.is_blindspot.is_(False))

    total = query.count()

    stories = (
        query.order_by(desc(Story.published_at)).offset(offset).limit(limit).all()
    )

    story_ids = [s.id for s in stories]
    articles = (
        db.query(Article)
        .filter(Article.story_id.in_(story_ids))
        .all()
    )
    image_map: dict[int, str | None] = {}
    for article in articles:
        if article.image_url and article.story_id not in image_map:
            image_map[article.story_id] = article.image_url

    stories_out = [
        StoryWithCoverage(
            id=s.id,
            headline=s.headline,
            summary=s.summary,
            published_at=s.published_at,
            left_count=s.left_count,
            center_count=s.center_count,
            right_count=s.right_count,
            is_blindspot=s.is_blindspot,
            blindspot_perspective=s.blindspot_perspective,
            total_coverage=s.total_coverage,
            image_url=image_map.get(s.id),
        )
        for s in stories
    ]

    return FeedResponse(
        stories=stories_out,
        pagination=PaginationMeta(
            total=total,
            limit=limit,
            offset=offset,
            has_more=(offset + limit) < total,
        ),
    )


def get_story_detail(db: Session, story_id: int) -> StoryDetailResponse | None:
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        return None

    articles = (
        db.query(Article)
        .options(joinedload(Article.source))
        .filter(Article.story_id == story_id)
        .order_by(Article.published_at.desc())
        .all()
    )

    return StoryDetailResponse(
        id=story.id,
        headline=story.headline,
        summary=story.summary,
        published_at=story.published_at,
        left_count=story.left_count,
        center_count=story.center_count,
        right_count=story.right_count,
        is_blindspot=story.is_blindspot,
        blindspot_perspective=story.blindspot_perspective,
        articles=articles,
    )
