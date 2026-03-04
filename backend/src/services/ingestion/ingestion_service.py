import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.article import Article
from src.models.source import Source
from src.models.story import Story
from src.services.bias.bias_service import get_bias_for_url, get_bias_category
from src.services.clustering.clustering_service import (
    cluster_articles,
    pick_headline,
    pick_image,
    pick_summary,
)
from src.services.clustering.embeddings import get_embedding
from src.services.ingestion.gnews_client import fetch_top_headlines

logger = logging.getLogger("mosaic.ingestion")


def _get_or_create_source(db: Session, domain: str) -> Source | None:
    source = db.query(Source).filter(Source.domain == domain).first()
    if source:
        return source

    bias_info = get_bias_for_url(f"https://{domain}")
    if not bias_info:
        return None

    source = Source(
        name=bias_info["name"],
        domain=domain,
        bias_rating=bias_info["bias_rating"],
        confidence=bias_info["confidence"],
    )
    db.add(source)
    db.flush()
    return source


def _parse_published_at(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return datetime.now(timezone.utc)


async def ingest_articles(db: Session) -> dict:
    raw_articles = await fetch_top_headlines(max_results=100)

    if not raw_articles:
        logger.warning("No articles fetched from GNews")
        return {"new_stories": 0, "new_articles": 0}

    # Filter to known sources
    known_articles = []
    for article in raw_articles:
        url = article.get("url", "")
        domain = urlparse(url).netloc.lower().lstrip("www.")
        bias_info = get_bias_for_url(url)
        if bias_info:
            article["_domain"] = domain
            article["_bias_info"] = bias_info
            known_articles.append(article)

    logger.info(
        "Filtered %d/%d articles to known sources",
        len(known_articles),
        len(raw_articles),
    )

    # Check for duplicate URLs
    existing_urls = {
        row[0]
        for row in db.query(Article.url)
        .filter(Article.url.in_([a["url"] for a in known_articles]))
        .all()
    }
    new_articles = [a for a in known_articles if a["url"] not in existing_urls]

    if not new_articles:
        logger.info("No new articles to ingest")
        return {"new_stories": 0, "new_articles": 0}

    # Cluster articles into stories
    clusters = cluster_articles(
        new_articles, similarity_threshold=settings.clustering_similarity_threshold
    )

    new_stories_count = 0
    new_articles_count = 0

    for cluster in clusters:
        headline = pick_headline(cluster)
        summary = pick_summary(cluster)
        image_url = pick_image(cluster)

        # Count bias distribution
        left_count = 0
        center_count = 0
        right_count = 0

        for article in cluster:
            category = get_bias_category(article["_bias_info"]["bias_rating"])
            if category == "left":
                left_count += 1
            elif category == "center":
                center_count += 1
            else:
                right_count += 1

        # Create story
        story = Story(
            headline=headline,
            summary=summary,
            published_at=_parse_published_at(cluster[0].get("publishedAt")),
            left_count=left_count,
            center_count=center_count,
            right_count=right_count,
        )
        story.compute_blindspot(settings.blindspot_threshold)
        db.add(story)
        db.flush()
        new_stories_count += 1

        # Create articles
        for raw_article in cluster:
            source = _get_or_create_source(db, raw_article["_domain"])
            if not source:
                continue

            embedding = get_embedding(raw_article.get("title", ""))

            article = Article(
                story_id=story.id,
                source_id=source.id,
                title=raw_article.get("title", ""),
                url=raw_article["url"],
                published_at=_parse_published_at(raw_article.get("publishedAt")),
                snippet=raw_article.get("description"),
                image_url=raw_article.get("image") or image_url,
                embedding=embedding.tobytes(),
            )
            db.add(article)
            new_articles_count += 1

    db.commit()

    logger.info(
        "Ingested %d new stories with %d articles",
        new_stories_count,
        new_articles_count,
    )

    return {"new_stories": new_stories_count, "new_articles": new_articles_count}
