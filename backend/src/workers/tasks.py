import asyncio
import logging

from src.core.cache import cache_delete_pattern
from src.core.database import SessionLocal
from src.services.ingestion.ingestion_service import ingest_articles
from src.workers.celery_app import celery_app

logger = logging.getLogger("mosaic.workers")


@celery_app.task(name="src.workers.tasks.scheduled_ingestion")
def scheduled_ingestion():
    logger.info("Starting scheduled article ingestion")

    db = SessionLocal()
    try:
        result = asyncio.run(ingest_articles(db))
        cache_delete_pattern("feed:*")
        logger.info(
            "Ingestion complete: %d new stories, %d new articles",
            result["new_stories"],
            result["new_articles"],
        )
        return result
    except Exception:
        logger.exception("Ingestion task failed")
        raise
    finally:
        db.close()


@celery_app.task(name="src.workers.tasks.aggregate_old_usage")
def aggregate_old_usage():
    """Aggregate token_usage records older than retention_days into token_usage_daily."""
    logger.info("Starting usage aggregation")
    db = SessionLocal()
    try:
        from src.services.usage.usage_service import aggregate_old_usage as _aggregate

        _aggregate(db)
        logger.info("Usage aggregation complete")
    except Exception:
        logger.exception("Usage aggregation task failed")
        raise
    finally:
        db.close()


@celery_app.task(name="src.workers.tasks.check_usage_alerts")
def check_usage_alerts():
    """Check periodic usage alerts (daily spend, cache hit rate)."""
    db = SessionLocal()
    try:
        from src.services.usage.usage_service import check_periodic_alerts

        check_periodic_alerts(db)
    except Exception:
        logger.exception("Usage alert check task failed")
        raise
    finally:
        db.close()


@celery_app.task(name="src.workers.tasks.generate_story_summaries")
def generate_story_summaries(story_id: int = None):
    """Generate pre-computed perspective summaries for a story or all eligible stories."""
    logger.info(f"Starting story summary pre-computation (story_id={story_id})")
    db = SessionLocal()
    try:
        from src.services.precompute.summary_generator import precompute_story_summaries

        asyncio.run(precompute_story_summaries(db, story_id=story_id))
        logger.info("Story summary pre-computation complete")
    except Exception:
        logger.exception("Story summary pre-computation task failed")
        raise
    finally:
        db.close()


@celery_app.task(name="src.workers.tasks.cleanup_expired_summaries")
def cleanup_expired_summaries():
    """Remove expired pre-computed story summaries."""
    db = SessionLocal()
    try:
        from src.services.precompute.summary_generator import cleanup_expired

        cleanup_expired(db)
    except Exception:
        logger.exception("Cleanup expired summaries task failed")
        raise
    finally:
        db.close()
