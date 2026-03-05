from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from repositories.reel_tag_repository import get_tag, upsert_tag
from repositories.reel_repository import get_reel_with_insights
from schemas.reel_tag_schema import ReelTagUpdate, ReelTagResponse
from models.reel import Reel

router = APIRouter(tags=["tags"])

VALID_CATEGORIES = {"Fitness", "Beauty", "Lifestyle", "Fashion", "Faith", "Travel"}


@router.get("/reel-tags")
def get_all_reel_tags(db: Session = Depends(get_db)):
    """Returns all manual tags as a map of reel_id → tag data."""
    from repositories.reel_tag_repository import get_all_tags
    tags = get_all_tags(db)
    return {t.reel_id: {"category": t.category, "storytelling": t.storytelling} for t in tags}


@router.get("/reels/{reel_id}/tags", response_model=ReelTagResponse)
def get_reel_tags(reel_id: str, db: Session = Depends(get_db)):
    tag = get_tag(db, reel_id)
    if not tag:
        return ReelTagResponse(reel_id=reel_id, category=None, storytelling=False)
    return tag


@router.put("/reels/{reel_id}/tags", response_model=ReelTagResponse)
def set_reel_tags(reel_id: str, body: ReelTagUpdate, db: Session = Depends(get_db)):
    if body.category and body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"category must be one of {VALID_CATEGORIES}")

    # Persist the manual tag
    tag = upsert_tag(db, reel_id, body.category, body.storytelling)

    # Also update Reel.category so analytics queries stay accurate
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if reel and body.category:
        reel.category = body.category
        db.commit()

    return tag
