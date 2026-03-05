from pathlib import Path

from pydantic_settings import BaseSettings

# Walk up from this file to find the repo root .env
_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_FILE = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    gnews_api_key: str = ""
    supabase_url: str = ""
    supabase_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://user:password@localhost:5432/mosaic"

    # Feed settings
    feed_cache_ttl: int = 900  # 15 minutes
    story_cache_ttl: int = 1800  # 30 minutes
    ingestion_interval_minutes: int = 15

    # Clustering settings
    clustering_similarity_threshold: float = 0.75
    blindspot_threshold: float = 0.8

    # Chat / AI settings
    anthropic_api_key: str = ""
    # TODO: Add embedding API key (e.g. VOYAGE_API_KEY) when adding vector search

    chat_rate_limit_per_minute: int = 10
    chat_max_message_length: int = 2000
    chat_context_token_limit: int = 3000
    chat_max_chunks_per_query: int = 8
    chat_abuse_redirect_limit: int = 3
    chat_history_retention_days: int = 30

    # Debate settings
    debate_context_token_limit: int = 4000

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}


settings = Settings()
