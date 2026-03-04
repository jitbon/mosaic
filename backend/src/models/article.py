from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text, func
from sqlalchemy.orm import relationship

from src.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    story_id = Column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_id = Column(
        Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(Text, nullable=False)
    url = Column(String(2048), nullable=False, unique=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    snippet = Column(Text, nullable=True)
    image_url = Column(String(2048), nullable=True)
    embedding = Column(LargeBinary, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    story = relationship("Story", back_populates="articles")
    source = relationship("Source", back_populates="articles")
