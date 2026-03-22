"""Admin endpoints for token usage reporting and pre-computation triggers."""

from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.schemas.admin import (
    AlertResponse,
    CacheStatsResponse,
    PrecomputeResponse,
    UsageReport,
)
from src.services.usage.usage_service import get_cache_stats, get_usage_report

router = APIRouter(prefix="/admin")


@router.get("/usage", response_model=UsageReport)
def usage_report(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    feature_type: Optional[str] = Query(default=None),
    group_by: str = Query(default="day"),
    story_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return aggregated token usage and cost data."""
    if feature_type and feature_type not in (
        "chat",
        "debate",
        "summarization",
        "precompute",
        "all",
    ):
        raise HTTPException(status_code=400, detail="Invalid feature_type")
    if group_by not in ("day", "hour", "story", "conversation"):
        raise HTTPException(status_code=400, detail="Invalid group_by value")

    report = get_usage_report(
        db=db,
        start_date=start_date,
        end_date=end_date,
        feature_type=feature_type,
        group_by=group_by,
        story_id=story_id,
    )
    return report


@router.get("/usage/alerts", response_model=AlertResponse)
def usage_alerts(
    since: Optional[datetime] = Query(default=None),
    alert_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Return recent alert events.

    Note: alerts are currently logged only (no persistent alert table). This
    endpoint returns an empty list — a persistent AlertEvent model can be added
    in a follow-up if needed.
    """
    return {"alerts": []}


@router.get("/usage/cache-stats", response_model=CacheStatsResponse)
def cache_stats(
    period: str = Query(default="24h"),
    db: Session = Depends(get_db),
):
    """Return prompt cache performance metrics."""
    if period not in ("1h", "24h", "7d", "30d"):
        raise HTTPException(
            status_code=400, detail="Invalid period. Use: 1h, 24h, 7d, 30d"
        )
    return get_cache_stats(db=db, period=period)


@router.post(
    "/stories/{story_id}/precompute", response_model=PrecomputeResponse, status_code=202
)
def trigger_precompute(story_id: int, db: Session = Depends(get_db)):
    """Queue pre-computation of perspective summaries for a story."""
    try:
        from src.workers.tasks import generate_story_summaries

        generate_story_summaries.delay(story_id=story_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue task: {e}")

    return {
        "message": "Pre-computation queued",
        "story_id": story_id,
        "perspectives": ["left", "center", "right"],
    }
