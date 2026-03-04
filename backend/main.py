from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from sqlalchemy.orm import configure_mappers

import models.reel
import models.reel_insight

from controllers.reel_controller import router as reel_router
from controllers.reel_insight_controller import router as insight_router
from controllers.analytics_controller import router as analytics_router
from controllers.prediction_controller import router as prediction_router
from controllers.ingestion_controller import router as ingestion_router

app = FastAPI(title="Creator Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML model — non-fatal if not yet trained
try:
    import joblib, pickle, os
    _model_path    = os.path.join("ml", "model.pkl")
    _features_path = os.path.join("ml", "features.pkl")
    app.state.model    = joblib.load(_model_path)
    with open(_features_path, "rb") as f:
        app.state.features = pickle.load(f)
    print("[startup] ML model loaded successfully.")
except Exception as e:
    app.state.model    = None
    app.state.features = None
    print(f"[startup] ML model not loaded: {e}. Run ml/train_model.py first.")

# Force SQLAlchemy to configure relationships before creating tables
configure_mappers()
Base.metadata.create_all(bind=engine)

app.include_router(reel_router)
app.include_router(insight_router)
app.include_router(analytics_router)
app.include_router(prediction_router)
app.include_router(ingestion_router)


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "ml_model_loaded": app.state.model is not None,
    }