from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from core.database import Base


class ReelTag(Base):
    __tablename__ = "reel_tags"

    # Plain string — intentionally NOT a FK so it survives ingest/clear
    reel_id      = Column(String, primary_key=True, index=True)
    category     = Column(String, nullable=True)   # Fitness | Beauty | Lifestyle
    storytelling = Column(Boolean, default=False, nullable=False)
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
