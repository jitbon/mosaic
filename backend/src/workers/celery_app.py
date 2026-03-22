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
        "check-usage-alerts": {
            "task": "src.workers.tasks.check_usage_alerts",
            "schedule": 300,  # every 5 minutes
        },
        "aggregate-old-usage": {
            "task": "src.workers.tasks.aggregate_old_usage",
            "schedule": 86400,  # daily
        },
        "cleanup-expired-summaries": {
            "task": "src.workers.tasks.cleanup_expired_summaries",
            "schedule": 3600,  # hourly
        },
    },
)
