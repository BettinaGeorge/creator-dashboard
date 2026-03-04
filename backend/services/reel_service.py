from sqlalchemy.orm import Session
from repositories.reel_repository import create_reel, get_all_reels
from repositories.reel_repository import get_reel_with_insights


def create_reel_service(db: Session, reel_data: dict):
    # Later we can add validation, transformations, metrics
    return create_reel(db, reel_data)

def get_all_reels_service(db: Session, source: str = None):
    return get_all_reels(db, source=source)

def get_reel_with_insights_service(db: Session, reel_id: str):
    return get_reel_with_insights(db, reel_id)