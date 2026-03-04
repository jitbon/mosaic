from celery import Celery

from src.core.config import settings

celery_app = Celery(
    "mosaic",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "ingest-articles": {
            "task": "src.workers.tasks.scheduled_ingestion",
            "schedule": settings.ingestion_interval_minutes * 60,
        },
    },
)
