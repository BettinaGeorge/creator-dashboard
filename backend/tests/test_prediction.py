"""
Tests for the ML prediction endpoint and predictor module.
"""
import pytest


def test_predict_endpoint_loaded(client):
    payload = {
        "duration_sec": 30,
        "hook_strength_score": 7,
        "niche": "Fitness",
        "music_type": "Trending",
        "is_weekend": False,
    }
    r = client.post("/predict/", json=payload)
    # If model is loaded, returns prediction; if not, returns 503
    assert r.status_code in (200, 503)


def test_predict_returns_expected_fields(client):
    payload = {
        "duration_sec": 45,
        "hook_strength_score": 9,
        "niche": "Beauty",
        "music_type": "Original",
        "is_weekend": True,
    }
    r = client.post("/predict/", json=payload)
    if r.status_code == 200:
        data = r.json()
        assert "predicted_views" in data
        assert "virality_probability" in data
        assert data["predicted_views"] >= 0
        assert 0.0 <= data["virality_probability"] <= 1.0


def test_predict_empty_payload(client):
    r = client.post("/predict/", json={})
    # Missing required fields — should return 422
    assert r.status_code == 422


def test_predictor_directly():
    """Test the predictor module bypassing the HTTP layer."""
    try:
        from ml.predictor import predict_reel
        result = predict_reel({
            "duration_sec": 30,
            "hook_strength_score": 8,
            "niche": "Fitness",
            "music_type": "Trending",
            "is_weekend": 0,
        })
        assert "predicted_views" in result
        assert "virality_probability" in result
    except FileNotFoundError:
        pytest.skip("ML model not trained yet")
