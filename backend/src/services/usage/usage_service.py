"""Token usage tracking, reporting, and alerting service."""

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy import Integer, and_, func
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.token_usage import TokenUsage, TokenUsageDaily

logger = logging.getLogger(__name__)


def record_usage(
    db: Session,
    feature_type: str,
    model_name: str,
    input_tokens: int,
    output_tokens: int,
    cache_creation_tokens: int = 0,
    cache_read_tokens: int = 0,
    story_id: Optional[int] = None,
    conversation_id: Optional[int] = None,
    debate_id: Optional[int] = None,
) -> TokenUsage:
    """Record a single API call's token usage."""
    estimated_cost = (
        (input_tokens * settings.model_cost_input_per_million / 1_000_000)
        + (output_tokens * settings.model_cost_output_per_million / 1_000_000)
        + (cache_read_tokens * settings.model_cost_cache_read_per_million / 1_000_000)
        + (
            cache_creation_tokens
            * settings.model_cost_cache_write_per_million
            / 1_000_000
        )
    )

    record = TokenUsage(
        feature_type=feature_type,
        model_name=model_name,
        story_id=story_id,
        conversation_id=conversation_id,
        debate_id=debate_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cache_creation_tokens=cache_creation_tokens,
        cache_read_tokens=cache_read_tokens,
        estimated_cost_usd=estimated_cost,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(
        f"Recorded usage: feature={feature_type} input={input_tokens} output={output_tokens} "
        f"cache_read={cache_read_tokens} cost=${estimated_cost:.6f}"
    )
    return record


def get_usage_report(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    feature_type: Optional[str] = None,
    group_by: str = "day",
    story_id: Optional[int] = None,
) -> dict:
    """Query token usage and return aggregated report data."""
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=7)

    start_dt = datetime(
        start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc
    )
    end_dt = datetime(
        end_date.year, end_date.month, end_date.day, 23, 59, 59, tzinfo=timezone.utc
    )

    filters = [
        TokenUsage.created_at >= start_dt,
        TokenUsage.created_at <= end_dt,
    ]
    if feature_type and feature_type != "all":
        filters.append(TokenUsage.feature_type == feature_type)
    if story_id is not None:
        filters.append(TokenUsage.story_id == story_id)

    totals_q = (
        db.query(
            func.sum(TokenUsage.input_tokens).label("input_tokens"),
            func.sum(TokenUsage.output_tokens).label("output_tokens"),
            func.sum(TokenUsage.cache_creation_tokens).label("cache_creation_tokens"),
            func.sum(TokenUsage.cache_read_tokens).label("cache_read_tokens"),
            func.sum(TokenUsage.estimated_cost_usd).label("estimated_cost_usd"),
            func.count(TokenUsage.id).label("request_count"),
            func.sum(func.cast(TokenUsage.cache_read_tokens > 0, Integer)).label(
                "cache_hit_count"
            ),
        )
        .filter(and_(*filters))
        .one()
    )

    total_input = totals_q.input_tokens or 0
    total_output = totals_q.output_tokens or 0
    total_cache_creation = totals_q.cache_creation_tokens or 0
    total_cache_read = totals_q.cache_read_tokens or 0
    total_cost = totals_q.estimated_cost_usd or 0.0
    request_count = totals_q.request_count or 0
    cache_hit_count = totals_q.cache_hit_count or 0
    cache_hit_rate = cache_hit_count / request_count if request_count > 0 else 0.0

    # Build breakdown
    if group_by == "day":
        group_col = func.date(TokenUsage.created_at).label("group_key")
    elif group_by == "hour":
        group_col = func.date_trunc("hour", TokenUsage.created_at).label("group_key")
    elif group_by == "story":
        group_col = TokenUsage.story_id.label("group_key")
    elif group_by == "conversation":
        group_col = TokenUsage.conversation_id.label("group_key")
    else:
        group_col = func.date(TokenUsage.created_at).label("group_key")

    breakdown_q = (
        db.query(
            group_col,
            TokenUsage.feature_type,
            func.sum(TokenUsage.input_tokens).label("input_tokens"),
            func.sum(TokenUsage.output_tokens).label("output_tokens"),
            func.sum(TokenUsage.cache_creation_tokens).label("cache_creation_tokens"),
            func.sum(TokenUsage.cache_read_tokens).label("cache_read_tokens"),
            func.sum(TokenUsage.estimated_cost_usd).label("estimated_cost_usd"),
            func.count(TokenUsage.id).label("request_count"),
            func.sum(func.cast(TokenUsage.cache_read_tokens > 0, Integer)).label(
                "cache_hit_count"
            ),
        )
        .filter(and_(*filters))
        .group_by("group_key", TokenUsage.feature_type)
        .order_by("group_key")
        .all()
    )

    breakdown = []
    for row in breakdown_q:
        row_requests = row.request_count or 0
        row_hits = row.cache_hit_count or 0
        breakdown.append(
            {
                "group_key": str(row.group_key),
                "feature_type": row.feature_type,
                "input_tokens": row.input_tokens or 0,
                "output_tokens": row.output_tokens or 0,
                "cache_creation_tokens": row.cache_creation_tokens or 0,
                "cache_read_tokens": row.cache_read_tokens or 0,
                "estimated_cost_usd": round(row.estimated_cost_usd or 0.0, 6),
                "request_count": row_requests,
                "cache_hit_rate": row_hits / row_requests if row_requests > 0 else 0.0,
            }
        )

    return {
        "period": {"start": str(start_date), "end": str(end_date)},
        "totals": {
            "input_tokens": total_input,
            "output_tokens": total_output,
            "cache_creation_tokens": total_cache_creation,
            "cache_read_tokens": total_cache_read,
            "estimated_cost_usd": round(total_cost, 6),
            "request_count": request_count,
            "cache_hit_rate": round(cache_hit_rate, 4),
        },
        "breakdown": breakdown,
    }


def get_cache_stats(db: Session, period: str = "24h") -> dict:
    """Return prompt cache performance metrics for a given time window."""
    period_map = {"1h": 1, "24h": 24, "7d": 168, "30d": 720}
    hours = period_map.get(period, 24)
    since = datetime.now(tz=timezone.utc) - timedelta(hours=hours)

    rows = (
        db.query(
            TokenUsage.feature_type,
            func.count(TokenUsage.id).label("requests"),
            func.sum(func.cast(TokenUsage.cache_read_tokens > 0, Integer)).label(
                "hits"
            ),
        )
        .filter(TokenUsage.created_at >= since)
        .group_by(TokenUsage.feature_type)
        .all()
    )

    total_requests = sum(r.requests for r in rows)
    total_hits = sum(r.hits or 0 for r in rows)

    # Tokens saved = cache_read_tokens * (regular_input_cost - cache_read_cost) / regular_input_cost
    savings_q = (
        db.query(
            func.sum(TokenUsage.cache_read_tokens).label("total_cache_read"),
            func.sum(TokenUsage.estimated_cost_usd).label("total_cost"),
        )
        .filter(TokenUsage.created_at >= since)
        .one()
    )

    total_cache_read = savings_q.total_cache_read or 0
    # Savings = what it would have cost at full price minus cache read price
    cost_diff_per_token = (
        settings.model_cost_input_per_million
        - settings.model_cost_cache_read_per_million
    ) / 1_000_000
    estimated_savings = total_cache_read * cost_diff_per_token

    by_feature = {}
    for r in rows:
        r_requests = r.requests or 0
        r_hits = r.hits or 0
        by_feature[r.feature_type] = {
            "hit_rate": round(r_hits / r_requests, 4) if r_requests > 0 else 0.0,
            "requests": r_requests,
        }

    return {
        "period": period,
        "total_requests": total_requests,
        "cache_hits": total_hits,
        "cache_misses": total_requests - total_hits,
        "hit_rate": round(total_hits / total_requests, 4)
        if total_requests > 0
        else 0.0,
        "tokens_saved": total_cache_read,
        "estimated_savings_usd": round(estimated_savings, 6),
        "by_feature": by_feature,
    }


def check_conversation_alert(db: Session, conversation_id: int) -> None:
    """Check if a conversation has exceeded the cost threshold and fire alert if so."""
    total_cost = (
        db.query(func.sum(TokenUsage.estimated_cost_usd))
        .filter(TokenUsage.conversation_id == conversation_id)
        .scalar()
    ) or 0.0

    if total_cost > settings.alert_conversation_cost_threshold:
        message = (
            f"Conversation {conversation_id} exceeded cost threshold: "
            f"${total_cost:.4f} (limit: ${settings.alert_conversation_cost_threshold:.2f})"
        )
        logger.warning(f"ALERT conversation_cost: {message}")
        _send_webhook_alert(
            "conversation_cost",
            message,
            actual_value=total_cost,
            threshold_value=settings.alert_conversation_cost_threshold,
        )


def check_periodic_alerts(db: Session) -> None:
    """Check daily spend and cache hit rate alerts."""
    today = date.today()
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    daily_cost = (
        db.query(func.sum(TokenUsage.estimated_cost_usd))
        .filter(TokenUsage.created_at >= today_start)
        .scalar()
    ) or 0.0

    if daily_cost > settings.alert_daily_spend_threshold:
        message = (
            f"Daily spend exceeded threshold: ${daily_cost:.4f} "
            f"(limit: ${settings.alert_daily_spend_threshold:.2f})"
        )
        logger.warning(f"ALERT daily_spend: {message}")
        _send_webhook_alert(
            "daily_spend",
            message,
            actual_value=daily_cost,
            threshold_value=settings.alert_daily_spend_threshold,
        )

    # Cache hit rate check (last 24h)
    since = datetime.now(tz=timezone.utc) - timedelta(hours=24)
    counts = (
        db.query(
            func.count(TokenUsage.id).label("total"),
            func.sum(func.cast(TokenUsage.cache_read_tokens > 0, Integer)).label(
                "hits"
            ),
        )
        .filter(TokenUsage.created_at >= since)
        .one()
    )
    total = counts.total or 0
    hits = counts.hits or 0
    if total >= 10:  # Only alert if there's meaningful traffic
        hit_rate = hits / total
        if hit_rate < settings.alert_cache_hit_rate_minimum:
            message = (
                f"Cache hit rate below minimum: {hit_rate:.1%} "
                f"(minimum: {settings.alert_cache_hit_rate_minimum:.1%})"
            )
            logger.warning(f"ALERT cache_rate: {message}")
            _send_webhook_alert(
                "cache_rate",
                message,
                actual_value=hit_rate,
                threshold_value=settings.alert_cache_hit_rate_minimum,
            )


def _send_webhook_alert(
    alert_type: str,
    message: str,
    actual_value: float,
    threshold_value: float,
) -> None:
    """Send alert to configured webhook URL if set."""
    if not settings.alert_webhook_url:
        return
    try:
        payload = {
            "alert_type": alert_type,
            "message": message,
            "actual_value": actual_value,
            "threshold_value": threshold_value,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }
        httpx.post(settings.alert_webhook_url, json=payload, timeout=5)
    except Exception as e:
        logger.error(f"Failed to send webhook alert: {e}")


def aggregate_old_usage(db: Session) -> None:
    """Aggregate token_usage records older than retention days into token_usage_daily."""
    cutoff = date.today() - timedelta(days=settings.usage_retention_days)
    cutoff_dt = datetime(cutoff.year, cutoff.month, cutoff.day, tzinfo=timezone.utc)

    rows = (
        db.query(
            func.date(TokenUsage.created_at).label("day"),
            TokenUsage.feature_type,
            func.sum(TokenUsage.input_tokens).label("total_input"),
            func.sum(TokenUsage.output_tokens).label("total_output"),
            func.sum(TokenUsage.cache_creation_tokens).label("total_cache_creation"),
            func.sum(TokenUsage.cache_read_tokens).label("total_cache_read"),
            func.sum(TokenUsage.estimated_cost_usd).label("total_cost"),
            func.count(TokenUsage.id).label("request_count"),
            func.sum(func.cast(TokenUsage.cache_read_tokens > 0, Integer)).label(
                "cache_hit_count"
            ),
        )
        .filter(TokenUsage.created_at < cutoff_dt)
        .group_by("day", TokenUsage.feature_type)
        .all()
    )

    for row in rows:
        existing = (
            db.query(TokenUsageDaily)
            .filter(
                TokenUsageDaily.date == row.day,
                TokenUsageDaily.feature_type == row.feature_type,
            )
            .first()
        )
        if existing:
            existing.total_input_tokens += row.total_input or 0
            existing.total_output_tokens += row.total_output or 0
            existing.total_cache_creation_tokens += row.total_cache_creation or 0
            existing.total_cache_read_tokens += row.total_cache_read or 0
            existing.total_estimated_cost_usd += row.total_cost or 0.0
            existing.request_count += row.request_count or 0
            existing.cache_hit_count += row.cache_hit_count or 0
        else:
            db.add(
                TokenUsageDaily(
                    date=row.day,
                    feature_type=row.feature_type,
                    total_input_tokens=row.total_input or 0,
                    total_output_tokens=row.total_output or 0,
                    total_cache_creation_tokens=row.total_cache_creation or 0,
                    total_cache_read_tokens=row.total_cache_read or 0,
                    total_estimated_cost_usd=row.total_cost or 0.0,
                    request_count=row.request_count or 0,
                    cache_hit_count=row.cache_hit_count or 0,
                )
            )

    db.commit()

    # Delete aggregated records
    deleted = (
        db.query(TokenUsage)
        .filter(TokenUsage.created_at < cutoff_dt)
        .delete(synchronize_session=False)
    )
    db.commit()
    logger.info(
        f"Aggregated and deleted {deleted} old token_usage records (before {cutoff})"
    )
