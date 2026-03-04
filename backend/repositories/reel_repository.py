from sqlalchemy.orm import Session
from models.reel import Reel
from sqlalchemy.orm import joinedload

def create_reel(db: Session, reel_data: dict):
    reel = Reel(**reel_data)
    db.add(reel)
    db.commit()
    db.refresh(reel)
    return reel

def get_all_reels(db: Session, source: str = None):
    query = db.query(Reel)
    if source:
        query = query.filter(Reel.source == source)
    return query.all()

def get_reel_with_insights(db: Session, reel_id: str):
    return db.query(Reel)\
        .options(joinedload(Reel.insights))\
        .filter(Reel.id == reel_id)\
        .first()