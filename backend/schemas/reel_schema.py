from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from schemas.reel_insight_schema import ReelInsightResponse
from typing import List

class ReelCreate(BaseModel):
    id: str
    caption: Optional[str] = None
    hook_text: Optional[str] = None
    duration: Optional[int] = None
    category: Optional[str] = None
    audio_type: Optional[str] = None
    posted_at: Optional[datetime] = None


class ReelResponse(BaseModel):
    id: str
    caption: Optional[str]
    hook_text: Optional[str]
    duration: Optional[int]
    category: Optional[str]
    audio_type: Optional[str]
    posted_at: Optional[datetime]
    created_at: Optional[datetime]
    video_url: Optional[str] = None

    insights: List[ReelInsightResponse] = []

    model_config = {
        "from_attributes": True
    }