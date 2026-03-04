import json
from typing import Any

import redis

from src.core.config import settings

_redis_client = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


def cache_get(key: str) -> Any | None:
    client = get_redis()
    data = client.get(key)
    if data:
        return json.loads(data)
    return None


def cache_set(key: str, value: Any, ttl: int = 900) -> None:
    client = get_redis()
    client.setex(key, ttl, json.dumps(value, default=str))


def cache_delete(key: str) -> None:
    client = get_redis()
    client.delete(key)


def cache_delete_pattern(pattern: str) -> None:
    client = get_redis()
    for key in client.scan_iter(match=pattern):
        client.delete(key)
