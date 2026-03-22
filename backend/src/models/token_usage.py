from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)

from src.core.database import Base


class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    feature_type = Column(
        String(20), nullable=False
    )  # chat, debate, summarization, precompute
    model_name = Column(String(50), nullable=False)
    story_id = Column(
        Integer, ForeignKey("stories.id", ondelete="SET NULL"), nullable=True
    )
    conversation_id = Column(
        Integer, ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True
    )
    debate_id = Column(
        Integer, ForeignKey("debates.id", ondelete="SET NULL"), nullable=True
    )
    input_tokens = Column(Integer, nullable=False)
    output_tokens = Column(Integer, nullable=False)
    cache_creation_tokens = Column(Integer, nullable=False, default=0)
    cache_read_tokens = Column(Integer, nullable=False, default=0)
    estimated_cost_usd = Column(Float, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("ix_token_usage_feature_type", "feature_type"),
        Index("ix_token_usage_story_id", "story_id"),
        Index("ix_token_usage_created_at", "created_at"),
        Index("ix_token_usage_feature_created", "feature_type", "created_at"),
    )


class TokenUsageDaily(Base):
    __tablename__ = "token_usage_daily"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    feature_type = Column(String(20), nullable=False)
    total_input_tokens = Column(BigInteger, nullable=False)
    total_output_tokens = Column(BigInteger, nullable=False)
    total_cache_creation_tokens = Column(BigInteger, nullable=False)
    total_cache_read_tokens = Column(BigInteger, nullable=False)
    total_estimated_cost_usd = Column(Float, nullable=False)
    request_count = Column(Integer, nullable=False)
    cache_hit_count = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "date", "feature_type", name="uq_token_usage_daily_date_feature"
        ),
        Index("ix_token_usage_daily_date", "date"),
    )
