from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey, Index, func
from sqlalchemy.orm import relationship

from src.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False
    )
    perspective = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    abuse_redirect_count = Column(Integer, nullable=False, default=0)
    is_ended = Column(Boolean, nullable=False, default=False)
    context_summary = Column(Text, nullable=True)

    story = relationship("Story")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at"
    )

    __table_args__ = (
        Index("ix_conversations_story_perspective", "story_id", "perspective"),
        Index("ix_conversations_updated_at", "updated_at"),
    )
