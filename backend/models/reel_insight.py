from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base
from models.reel import Reel  # ← explicit import

class ReelInsight(Base):
    __tablename__ = "reel_insights"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(String, ForeignKey("reels.id"), nullable=False)

    impressions = Column(Integer, nullable=True)
    reach = Column(Integer, nullable=True)
    engagement = Column(Integer, nullable=True)
    saves = Column(Integer, nullable=True)
    shares = Column(Integer, nullable=True)
    video_views = Column(Integer, nullable=True)

    snapshot_time = Column(DateTime(timezone=True), server_default=func.now())

    reel = relationship(Reel, back_populates="insights")