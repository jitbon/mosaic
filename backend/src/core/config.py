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

    # Auth settings (006-user-accounts)
    supabase_jwt_secret: str = ""
    supabase_service_role_key: str = ""

    chat_rate_limit_per_minute: int = 10
    chat_max_message_length: int = 2000
    chat_context_token_limit: int = 3000
    chat_max_chunks_per_query: int = 8
    chat_abuse_redirect_limit: int = 3
    chat_history_retention_days: int = 30

    # Debate settings
    debate_context_token_limit: int = 4000

    # Token budget settings
    token_budget_chat: int = 4000
    token_budget_debate: int = 6000
    context_window_recent_messages: int = 6
    summary_precompute_threshold: int = 5
    summary_precompute_ttl_hours: int = 24

    # Cost model settings (per million tokens)
    model_cost_input_per_million: float = 0.80
    model_cost_output_per_million: float = 4.00
    model_cost_cache_read_per_million: float = 0.08
    model_cost_cache_write_per_million: float = 1.00

    # Alert threshold settings
    alert_conversation_cost_threshold: float = 0.50
    alert_daily_spend_threshold: float = 50.00
    alert_cache_hit_rate_minimum: float = 0.40
    alert_webhook_url: str = ""

    # Usage retention
    usage_retention_days: int = 90

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}


settings = Settings()
