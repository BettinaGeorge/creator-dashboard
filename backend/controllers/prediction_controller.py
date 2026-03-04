from fastapi import APIRouter
from services.prediction_service import PredictionService

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("/")
def predict(data: dict):
    return PredictionService.predict(data)