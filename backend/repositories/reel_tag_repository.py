from typing import Optional, List
from sqlalchemy.orm import Session
from models.reel_tag import ReelTag


def get_tag(db: Session, reel_id: str) -> Optional[ReelTag]:
    return db.query(ReelTag).filter(ReelTag.reel_id == reel_id).first()


def upsert_tag(db: Session, reel_id: str, category: Optional[str], storytelling: bool) -> ReelTag:
    tag = db.query(ReelTag).filter(ReelTag.reel_id == reel_id).first()
    if tag:
        tag.category     = category
        tag.storytelling = storytelling
    else:
        tag = ReelTag(reel_id=reel_id, category=category, storytelling=storytelling)
        db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def get_all_tags(db: Session) -> List[ReelTag]:
    return db.query(ReelTag).all()
