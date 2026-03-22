"""Pre-computation of perspective summaries for popular stories."""

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from anthropic import AsyncAnthropic
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.article_chunk import ArticleChunk
from src.models.conversation import Conversation
from src.models.story_summary import StorySummary
from src.services.chat.chunking_service import count_tokens

logger = logging.getLogger(__name__)

PERSPECTIVES = ["left", "center", "right"]

_PERSPECTIVE_BIAS_MAP = {
    "left": "left",
    "center": "center",
    "right": "right",
}

_anthropic_client: Optional[AsyncAnthropic] = None


def _get_client() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _compute_hash(chunks: list[ArticleChunk]) -> str:
    """Compute SHA-256 hash of concatenated chunk content for staleness detection."""
    combined = "".join(c.content for c in sorted(chunks, key=lambda x: x.id))
    return hashlib.sha256(combined.encode()).hexdigest()


def check_staleness(db: Session, summary: StorySummary) -> bool:
    """Return True if the summary is stale (expired or source content changed)."""
    now = datetime.now(tz=timezone.utc)
    if summary.expires_at <= now:
        return True

    chunks = (
        db.query(ArticleChunk)
        .filter(
            ArticleChunk.story_id == summary.story_id,
            ArticleChunk.bias_label
            == _PERSPECTIVE_BIAS_MAP.get(summary.perspective, summary.perspective),
        )
        .all()
    )
    if not chunks:
        return True

    current_hash = _compute_hash(chunks)
    return current_hash != summary.source_version_hash


async def generate_story_summary(
    db: Session, story_id: int, perspective: str
) -> Optional[StorySummary]:
    """Generate and store a pre-computed perspective summary for a story."""
    bias_label = _PERSPECTIVE_BIAS_MAP.get(perspective, perspective)
    chunks = (
        db.query(ArticleChunk)
        .filter(
            ArticleChunk.story_id == story_id,
            ArticleChunk.bias_label == bias_label,
        )
        .order_by(ArticleChunk.chunk_index.asc())
        .all()
    )

    if not chunks:
        logger.info(
            f"No {perspective} chunks for story {story_id}, skipping pre-computation"
        )
        return None

    article_ids = list({c.article_id for c in chunks})
    source_hash = _compute_hash(chunks)

    chunk_text = "\n\n".join(c.content for c in chunks)
    prompt = (
        f"Summarize the following {perspective}-leaning news article excerpts about this story. "
        "Write a concise, factual summary (3-5 sentences) that captures the key facts, "
        "perspective-specific framing, and most important arguments or evidence presented. "
        "This summary will be used as context for an AI persona representing this perspective.\n\n"
        f"ARTICLE EXCERPTS:\n{chunk_text}"
    )

    client = _get_client()
    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        summary_text = response.content[0].text
        token_count = count_tokens(summary_text)
        expires_at = datetime.now(tz=timezone.utc) + timedelta(
            hours=settings.summary_precompute_ttl_hours
        )

        # Upsert: replace existing if present
        existing = (
            db.query(StorySummary)
            .filter(
                StorySummary.story_id == story_id,
                StorySummary.perspective == perspective,
            )
            .first()
        )
        if existing:
            existing.summary_text = summary_text
            existing.source_article_ids = article_ids
            existing.source_version_hash = source_hash
            existing.token_count = token_count
            existing.created_at = datetime.now(tz=timezone.utc)
            existing.expires_at = expires_at
            db.commit()
            db.refresh(existing)
            story_summary = existing
        else:
            story_summary = StorySummary(
                story_id=story_id,
                perspective=perspective,
                summary_text=summary_text,
                source_article_ids=article_ids,
                source_version_hash=source_hash,
                token_count=token_count,
                expires_at=expires_at,
            )
            db.add(story_summary)
            db.commit()
            db.refresh(story_summary)

        logger.info(
            f"Pre-computed {perspective} summary for story {story_id}: "
            f"{token_count} tokens, expires {expires_at.isoformat()}"
        )

        # T034: Record pre-computation usage
        try:
            from src.services.usage.usage_service import record_usage

            usage = response.usage
            record_usage(
                db=db,
                feature_type="precompute",
                model_name="claude-haiku-4-5-20251001",
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                story_id=story_id,
            )
        except Exception as ue:
            logger.error(f"Failed to record precompute usage: {ue}")

        return story_summary
    except Exception as e:
        logger.error(
            f"Failed to generate {perspective} summary for story {story_id}: {e}"
        )
        return None


async def precompute_story_summaries(
    db: Session, story_id: Optional[int] = None
) -> None:
    """Generate summaries for a specific story or all eligible stories."""
    if story_id is not None:
        for perspective in PERSPECTIVES:
            await generate_story_summary(db, story_id, perspective)
        return

    # Find stories with >= threshold conversations that don't have valid summaries
    threshold = settings.summary_precompute_threshold
    now = datetime.now(tz=timezone.utc)

    eligible_story_ids = (
        db.query(Conversation.story_id)
        .group_by(Conversation.story_id)
        .having(func.count(Conversation.id) >= threshold)
        .all()
    )

    for (sid,) in eligible_story_ids:
        for perspective in PERSPECTIVES:
            existing = (
                db.query(StorySummary)
                .filter(
                    StorySummary.story_id == sid,
                    StorySummary.perspective == perspective,
                    StorySummary.expires_at > now,
                )
                .first()
            )
            if existing and not check_staleness(db, existing):
                continue
            await generate_story_summary(db, sid, perspective)


def cleanup_expired(db: Session) -> None:
    """Delete expired story summaries."""
    now = datetime.now(tz=timezone.utc)
    deleted = (
        db.query(StorySummary)
        .filter(StorySummary.expires_at <= now)
        .delete(synchronize_session=False)
    )
    db.commit()
    if deleted:
        logger.info(f"Cleaned up {deleted} expired story summaries")
