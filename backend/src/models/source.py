from sqlalchemy import Column, DateTime, Float, Integer, String, func
from sqlalchemy.orm import relationship

from src.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=False, unique=True)
    bias_rating = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    articles = relationship("Article", back_populates="source")
