from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from src.core.database import Base


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    headline = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    left_count = Column(Integer, nullable=False, default=0)
    center_count = Column(Integer, nullable=False, default=0)
    right_count = Column(Integer, nullable=False, default=0)
    is_blindspot = Column(Boolean, nullable=False, default=False)
    blindspot_perspective = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    articles = relationship("Article", back_populates="story")

    @property
    def total_coverage(self) -> int:
        return self.left_count + self.center_count + self.right_count

    def compute_blindspot(self, threshold: float = 0.8) -> None:
        total = self.total_coverage
        if total == 0:
            self.is_blindspot = False
            self.blindspot_perspective = None
            return

        counts = {
            "left": self.left_count,
            "center": self.center_count,
            "right": self.right_count,
        }
        max_perspective = max(counts, key=counts.get)
        max_ratio = counts[max_perspective] / total

        if max_ratio >= threshold:
            self.is_blindspot = True
            self.blindspot_perspective = max_perspective
        else:
            self.is_blindspot = False
            self.blindspot_perspective = None
