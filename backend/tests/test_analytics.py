"""
Tests for analytics endpoints.
"""
from datetime import datetime
from models.reel import Reel
from models.reel_insight import ReelInsight


def _seed(db):
    reels = [
        Reel(id="r1", caption="Fitness reel", category="Fitness", audio_type="Trending", source="personal", posted_at=datetime(2025, 1, 6)),
        Reel(id="r2", caption="Beauty reel",  category="Beauty",  audio_type="Original", source="personal", posted_at=datetime(2025, 1, 7)),
        Reel(id="r3", caption="Travel reel",  category="Travel",  audio_type="Trending", source="personal", posted_at=datetime(2025, 1, 8)),
    ]
    db.add_all(reels)
    db.flush()
    insights = [
        ReelInsight(reel_id="r1", video_views=50000, engagement=2000, saves=300, shares=150, impressions=55000, reach=48000),
        ReelInsight(reel_id="r2", video_views=30000, engagement=1200, saves=200, shares=100, impressions=33000, reach=28000),
        ReelInsight(reel_id="r3", video_views=80000, engagement=4000, saves=600, shares=300, impressions=88000, reach=75000),
    ]
    db.add_all(insights)
    db.commit()


def test_summary_empty(client):
    r = client.get("/analytics/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_reels"] == 0


def test_summary_with_data(client, db):
    _seed(db)
    r = client.get("/analytics/summary?source=personal")
    assert r.status_code == 200
    data = r.json()
    assert data["total_reels"] == 3
    assert data["total_views"] == 160000


def test_categories(client, db):
    _seed(db)
    r = client.get("/analytics/categories?source=personal")
    assert r.status_code == 200
    categories = r.json()
    assert len(categories) == 3
    names = [c["category"] for c in categories]
    assert "Fitness" in names
    assert "Travel" in names


def test_top_performing(client, db):
    _seed(db)
    r = client.get("/analytics/top-performing?limit=2&source=personal")
    assert r.status_code == 200
    reels = r.json()
    assert len(reels) == 2
    assert reels[0]["video_views"] >= reels[1]["video_views"]


def test_audio_types(client, db):
    _seed(db)
    r = client.get("/analytics/audio-types?source=personal")
    assert r.status_code == 200
    audio = r.json()
    types = [a["audio_type"] for a in audio]
    assert "Trending" in types
    assert "Original" in types
