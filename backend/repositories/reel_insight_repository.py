from sqlalchemy.orm import Session
from models.reel_insight import ReelInsight

def create_insight(db: Session, insight_data: dict):
    insight = ReelInsight(**insight_data)
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight

def get_insights_for_reel(db: Session, reel_id: str):
    return db.query(ReelInsight).filter(
        ReelInsight.reel_id == reel_id
    ).all()