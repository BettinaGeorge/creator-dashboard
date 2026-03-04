from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from services.reel_insight_service import (
    create_insight_service,
    get_insights_for_reel_service
)
from schemas.reel_insight_schema import (
    ReelInsightCreate,
    ReelInsightResponse
)
from typing import List

router = APIRouter()

@router.post("/insights", response_model=ReelInsightResponse)
def create_insight_endpoint(
    insight: ReelInsightCreate,
    db: Session = Depends(get_db)
):
    return create_insight_service(db, insight.dict())

@router.get("/reels/{reel_id}/insights", response_model=List[ReelInsightResponse])
def get_insights_for_reel_endpoint(
    reel_id: str,
    db: Session = Depends(get_db)
):
    return get_insights_for_reel_service(db, reel_id)