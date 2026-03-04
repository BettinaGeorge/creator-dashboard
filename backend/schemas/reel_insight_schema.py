from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReelInsightCreate(BaseModel):
    reel_id: str
    impressions: Optional[int] = None
    reach: Optional[int] = None
    engagement: Optional[int] = None
    saves: Optional[int] = None
    shares: Optional[int] = None
    video_views: Optional[int] = None

class ReelInsightResponse(BaseModel):
    id: int
    reel_id: str
    impressions: Optional[int]
    reach: Optional[int]
    engagement: Optional[int]
    saves: Optional[int]
    shares: Optional[int]
    video_views: Optional[int]
    snapshot_time: Optional[datetime]

    model_config = {
    "from_attributes": True
}