from typing import Any

from pydantic import BaseModel


class UsagePeriod(BaseModel):
    start: str
    end: str


class UsageTotals(BaseModel):
    input_tokens: int
    output_tokens: int
    cache_creation_tokens: int
    cache_read_tokens: int
    estimated_cost_usd: float
    request_count: int
    cache_hit_rate: float


class UsageBreakdown(BaseModel):
    group_key: str
    feature_type: str
    input_tokens: int
    output_tokens: int
    cache_creation_tokens: int
    cache_read_tokens: int
    estimated_cost_usd: float
    request_count: int
    cache_hit_rate: float


class UsageReport(BaseModel):
    period: UsagePeriod
    totals: UsageTotals
    breakdown: list[UsageBreakdown]


class AlertResponse(BaseModel):
    alerts: list[dict[str, Any]]


class CacheFeatureStat(BaseModel):
    hit_rate: float
    requests: int


class CacheStatsResponse(BaseModel):
    period: str
    total_requests: int
    cache_hits: int
    cache_misses: int
    hit_rate: float
    tokens_saved: int
    estimated_savings_usd: float
    by_feature: dict[str, CacheFeatureStat]


class PrecomputeResponse(BaseModel):
    message: str
    story_id: int
    perspectives: list[str]
