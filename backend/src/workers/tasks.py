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
