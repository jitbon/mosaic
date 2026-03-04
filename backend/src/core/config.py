from pydantic_settings import BaseSettings


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

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
