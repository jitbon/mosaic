from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from src.core.database import Base


class Debate(Base):
    __tablename__ = "debates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False
    )
    personas = Column(JSONB, nullable=False)  # e.g. ["left", "right"]
    status = Column(String(20), nullable=False, default="active")
    current_round = Column(Integer, nullable=False, default=0)
    abuse_redirect_count = Column(Integer, nullable=False, default=0)
    context_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    story = relationship("Story")
    turns = relationship(
        "DebateTurn",
        back_populates="debate",
        cascade="all, delete-orphan",
        order_by="DebateTurn.turn_number",
    )

    __table_args__ = (
        Index("debates_story_id_idx", "story_id"),
        Index("debates_updated_at_idx", "updated_at"),
    )
