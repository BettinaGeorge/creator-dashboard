from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base

class Reel(Base):
    __tablename__ = "reels"

    id = Column(String, primary_key=True, index=True)
    caption = Column(Text, nullable=True)
    hook_text = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)
    category = Column(String, nullable=True)
    audio_type = Column(String, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    source = Column(String, nullable=True, default="synthetic")
    video_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    insights = relationship("ReelInsight", back_populates="reel")