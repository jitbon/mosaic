from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from src.core.database import Base


class StorySummary(Base):
    __tablename__ = "story_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(
        Integer,
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
    )
    perspective = Column(String(20), nullable=False)  # left, center, right
    summary_text = Column(Text, nullable=False)
    source_article_ids = Column(JSONB, nullable=False)
    source_version_hash = Column(String(64), nullable=False)
    token_count = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "story_id", "perspective", name="uq_story_summaries_story_perspective"
        ),
        Index("ix_story_summaries_story_id", "story_id"),
        Index("ix_story_summaries_expires_at", "expires_at"),
    )
