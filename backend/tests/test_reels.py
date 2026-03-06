"""
Tests for reel CRUD endpoints.
"""
from datetime import datetime
from models.reel import Reel
from models.reel_insight import ReelInsight


def test_list_reels_empty(client):
    r = client.get("/reels")
    assert r.status_code == 200
    assert r.json() == []


def test_create_and_get_reel(client):
    payload = {
        "id": "test123",
        "caption": "My first reel",
        "hook_text": "wait for it",
        "duration": 30,
        "category": "Fitness",
        "audio_type": "Trending",
        "source": "personal",
    }
    r = client.post("/reels", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "test123"
    assert data["caption"] == "My first reel"


def test_get_reel_not_found(client):
    r = client.get("/reels/nonexistent")
    assert r.status_code == 404


def test_list_reels_returns_all(client, db):
    db.add_all([
        Reel(id="r1", source="personal"),
        Reel(id="r2", source="personal"),
    ])
    db.commit()
    r = client.get("/reels")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_reel_with_insights(client, db):
    db.add(Reel(id="r1", caption="Test", source="personal"))
    db.flush()
    db.add(ReelInsight(reel_id="r1", video_views=50000, engagement=2000,
                       saves=300, shares=150, impressions=55000, reach=48000))
    db.commit()
    r = client.get("/reels/r1")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "r1"
    assert len(data["insights"]) == 1
    assert data["insights"][0]["video_views"] == 50000
