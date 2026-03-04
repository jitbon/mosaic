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
from sqlalchemy.orm import relationship

from src.core.database import Base


class DebateTurn(Base):
    __tablename__ = "debate_turns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    debate_id = Column(
        Integer, ForeignKey("debates.id", ondelete="CASCADE"), nullable=False
    )
    turn_number = Column(Integer, nullable=False)
    role = Column(
        String(20), nullable=False
    )  # persona_left, persona_center, persona_right, moderator
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    citations = Column(JSONB, nullable=True)
    round_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    debate = relationship("Debate", back_populates="turns")

    __table_args__ = (
        Index("debate_turns_debate_id_idx", "debate_id"),
        UniqueConstraint(
            "debate_id", "turn_number", name="debate_turns_debate_turn_idx"
        ),
    )
