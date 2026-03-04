from typing import Dict, Any
from sqlalchemy.orm import Session

from integrations.base_client import BaseIngestionClient
from models.reel import Reel
from repositories.reel_repository import create_reel
from repositories.reel_insight_repository import create_insight


def _reel_exists(db: Session, reel_id: str) -> bool:
    return db.query(Reel).filter(Reel.id == reel_id).first() is not None


def run_ingestion(db: Session, client: BaseIngestionClient) -> Dict[str, Any]:
    """
    Orchestrate full data ingestion using the provided client.

    Idempotent: reels already in the database are skipped, not duplicated.
    To change the data source, swap the client — this function stays the same.
    """
    reels   = client.fetch_reels()
    created = skipped = failed = 0

    for reel_data in reels:
        reel_id = reel_data.get("id")

        if not reel_id:
            failed += 1
            continue

        if _reel_exists(db, reel_id):
            skipped += 1
            continue

        try:
            create_reel(db, reel_data)

            insight_data = client.fetch_insights(reel_id)
            if insight_data:
                create_insight(db, {"reel_id": reel_id, **insight_data})

            created += 1
        except Exception as e:
            db.rollback()
            print(f"[ingestion] Failed to ingest reel {reel_id}: {e}")
            failed += 1

    return {
        "status":  "complete",
        "created": created,
        "skipped": skipped,
        "failed":  failed,
        "total":   len(reels),
    }


def clear_all(db: Session) -> Dict[str, Any]:
    """Remove all reels and insights from the database."""
    from models.reel_insight import ReelInsight

    deleted_insights = db.query(ReelInsight).delete()
    deleted_reels    = db.query(Reel).delete()
    db.commit()

    return {
        "status":           "cleared",
        "reels_deleted":    deleted_reels,
        "insights_deleted": deleted_insights,
    }
