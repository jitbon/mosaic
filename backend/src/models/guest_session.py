from sqlalchemy import Column, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID

from src.core.database import Base


class GuestSession(Base):
    __tablename__ = "guest_sessions"

    user_id = Column(UUID(as_uuid=True), primary_key=True, nullable=False)
    conversation_count = Column(Integer, nullable=False, default=0)
    first_seen_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    converted_at = Column(DateTime(timezone=True), nullable=True)
