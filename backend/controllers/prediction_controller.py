from fastapi import APIRouter, HTTPException
from services.prediction_service import PredictionService

router = APIRouter(prefix="/predict", tags=["prediction"])

REQUIRED_FIELDS = {"duration_sec", "hook_strength_score", "niche", "music_type", "is_weekend"}


@router.post("/")
def predict(data: dict):
    missing = REQUIRED_FIELDS - data.keys()
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required fields: {sorted(missing)}")
    try:
        return PredictionService.predict(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))