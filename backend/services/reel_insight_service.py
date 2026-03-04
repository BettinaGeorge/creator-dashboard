from sqlalchemy.orm import Session
from repositories.reel_insight_repository import create_insight, get_insights_for_reel

def create_insight_service(db: Session, insight_data: dict):
    return create_insight(db, insight_data)

def get_insights_for_reel_service(db: Session, reel_id: str):
    return get_insights_for_reel(db, reel_id)