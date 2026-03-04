from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from services.reel_service import create_reel_service, get_all_reels_service, get_reel_with_insights_service
from schemas.reel_schema import ReelCreate, ReelResponse

router = APIRouter()

@router.post("/reels", response_model=ReelResponse)
def create_reel_endpoint(
    reel: ReelCreate,
    db: Session = Depends(get_db)
):
    return create_reel_service(db, reel.dict())

@router.get("/reels", response_model=List[ReelResponse])
def get_reels_endpoint(source: Optional[str] = None, db: Session = Depends(get_db)):
    return get_all_reels_service(db, source=source)

@router.get("/reels/{reel_id}", response_model=ReelResponse)
def get_reel_with_insights_endpoint(
    reel_id: str,
    db: Session = Depends(get_db)
):
    return get_reel_with_insights_service(db, reel_id)

