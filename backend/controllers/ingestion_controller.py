from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from integrations.seed_client import SeedClient
from services.ingestion_service import run_ingestion, clear_all

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/")
def ingest(db: Session = Depends(get_db)):
    """
    Run full data ingestion using the seed client (CSV-backed).

    To switch to live Instagram data once the Graph API is configured:
        Replace: client = SeedClient()
        With:    client = InstagramClient()
    """
    client = SeedClient()
    return run_ingestion(db, client)


@router.delete("/clear")
def clear(db: Session = Depends(get_db)):
    """Remove all ingested reels and insights from the database."""
    return clear_all(db)
