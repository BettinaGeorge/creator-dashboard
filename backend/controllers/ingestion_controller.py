from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from integrations.instagram_export_client import InstagramExportClient
from services.ingestion_service import run_ingestion, clear_all

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/")
def ingest(db: Session = Depends(get_db)):
    """
    Run full data ingestion from the local Instagram data export.
    Loads 80 real reels with actual captions, timestamps and video files.

    To switch to live Instagram Graph API data once credentials are configured:
        Replace: client = InstagramExportClient()
        With:    client = InstagramClient()
    """
    client = InstagramExportClient()
    return run_ingestion(db, client)


@router.delete("/clear")
def clear(db: Session = Depends(get_db)):
    """Remove all ingested reels and insights from the database."""
    return clear_all(db)
