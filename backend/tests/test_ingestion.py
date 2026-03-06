"""
Tests for the ingestion service and export client.
"""
import pytest
from unittest.mock import patch, MagicMock
from services.ingestion_service import run_ingestion, clear_all
from models.reel import Reel
from models.reel_insight import ReelInsight


def _make_client(reels, insights=None):
    """Build a mock ingestion client."""
    mock = MagicMock()
    mock.fetch_reels.return_value = reels
    mock.fetch_insights.side_effect = lambda reel_id: (insights or {}).get(reel_id, {})
    return mock


def test_ingest_creates_reels(db):
    client = _make_client([
        {"id": "abc1", "caption": "Test reel", "hook_text": "hook", "duration": 30,
         "category": "Fitness", "audio_type": "Trending", "posted_at": None,
         "source": "personal", "video_url": None},
    ])
    result = run_ingestion(db, client)
    assert result["created"] == 1
    assert result["failed"] == 0
    assert db.query(Reel).count() == 1


def test_ingest_is_idempotent(db):
    client = _make_client([
        {"id": "abc1", "caption": "Test reel", "hook_text": None, "duration": None,
         "category": None, "audio_type": None, "posted_at": None,
         "source": "personal", "video_url": None},
    ])
    run_ingestion(db, client)
    result = run_ingestion(db, client)
    assert result["skipped"] == 1
    assert db.query(Reel).count() == 1


def test_ingest_with_insights(db):
    client = _make_client(
        reels=[{"id": "abc1", "caption": "Reel", "hook_text": None, "duration": 15,
                "category": "Beauty", "audio_type": "Original", "posted_at": None,
                "source": "personal", "video_url": None}],
        insights={"abc1": {"impressions": 10000, "reach": 9000, "engagement": 500,
                           "saves": 100, "shares": 50, "video_views": 8000}},
    )
    run_ingestion(db, client)
    assert db.query(ReelInsight).count() == 1
    insight = db.query(ReelInsight).first()
    assert insight.video_views == 8000


def test_ingest_skips_missing_id(db):
    client = _make_client([{"id": None, "caption": "No ID"}])
    result = run_ingestion(db, client)
    assert result["failed"] == 1
    assert db.query(Reel).count() == 0


def test_clear_removes_all(db):
    db.add(Reel(id="r1", source="personal"))
    db.add(Reel(id="r2", source="personal"))
    db.commit()
    result = clear_all(db)
    assert result["reels_deleted"] == 2
    assert db.query(Reel).count() == 0


def test_export_client_loads_reels():
    from integrations.instagram_export_client import InstagramExportClient
    client = InstagramExportClient()
    reels = client.fetch_reels()
    assert len(reels) == 80
    assert all(r["source"] == "personal" for r in reels)
    assert all("id" in r for r in reels)
