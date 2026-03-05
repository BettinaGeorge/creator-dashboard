from pydantic import BaseModel
from typing import Optional


class ReelTagUpdate(BaseModel):
    category:     Optional[str] = None   # Fitness | Beauty | Lifestyle | None to clear
    storytelling: bool = False


class ReelTagResponse(BaseModel):
    reel_id:      str
    category:     Optional[str]
    storytelling: bool

    model_config = {"from_attributes": True}
