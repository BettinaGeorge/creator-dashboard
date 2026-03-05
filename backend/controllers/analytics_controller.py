from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from services.analytics_service import (
    compute_reel_analytics,
    get_top_performing_hooks,
    get_summary,
    get_category_performance,
    get_audio_type_performance,
    get_top_performing_reels,
    get_growth_data,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def summary(source: Optional[str] = None, from_date: Optional[str] = None, db: Session = Depends(get_db)):
    """Overall performance stats. Pass ?source=personal and/or ?from_date=YYYY-MM-DD."""
    return get_summary(db, source=source, from_date=from_date)


@router.get("/categories")
def category_performance(source: Optional[str] = None, db: Session = Depends(get_db)):
    """Average views and engagement broken down by content category. Pass ?source=personal to filter."""
    return get_category_performance(db, source=source)


@router.get("/audio-types")
def audio_type_performance(source: Optional[str] = None, db: Session = Depends(get_db)):
    """Average views and engagement broken down by audio type. Pass ?source=personal to filter."""
    return get_audio_type_performance(db, source=source)


@router.get("/growth")
def growth(source: Optional[str] = None, from_date: Optional[str] = None, db: Session = Depends(get_db)):
    """Reels ordered chronologically — for growth trend chart. Accepts ?from_date=YYYY-MM-DD."""
    return get_growth_data(db, source=source, from_date=from_date)


@router.get("/top-performing")
def top_performing(limit: int = 10, source: Optional[str] = None, db: Session = Depends(get_db)):
    """Top performing reels by view count. Pass ?source=personal for personal reels only."""
    return get_top_performing_reels(db, limit=limit, source=source)


@router.get("/top-performing-hooks")
def top_performing_hooks():
    """Hook and niche performance benchmarks derived from the viral dataset."""
    return get_top_performing_hooks()


@router.get("/reel/{reel_id}")
def get_reel_analytics(reel_id: str, db: Session = Depends(get_db)):
    """Per-reel engagement rates relative to impressions."""
    return compute_reel_analytics(db, reel_id)