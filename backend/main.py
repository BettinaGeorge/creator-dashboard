from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.database import engine, Base
from sqlalchemy.orm import configure_mappers
from pathlib import Path

import models.reel
import models.reel_insight
import models.reel_tag

from controllers.reel_tag_controller import router as reel_tag_router
from controllers.reel_controller import router as reel_router
from controllers.ai_controller import router as ai_router
from controllers.reel_insight_controller import router as insight_router
from controllers.analytics_controller import router as analytics_router
from controllers.prediction_controller import router as prediction_router
from controllers.ingestion_controller import router as ingestion_router

app = FastAPI(title="Creator Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

# Add columns introduced after initial deployment (safe — IF NOT EXISTS is a no-op)
from sqlalchemy import text
with engine.connect() as _conn:
    _conn.execute(text("ALTER TABLE reels ADD COLUMN IF NOT EXISTS video_url TEXT"))
    _conn.execute(text("ALTER TABLE reels ADD COLUMN IF NOT EXISTS source VARCHAR"))
    _conn.commit()

app.include_router(reel_tag_router)
app.include_router(reel_router)
app.include_router(ai_router)
app.include_router(insight_router)
app.include_router(analytics_router)
app.include_router(prediction_router)
app.include_router(ingestion_router)

# Serve Instagram export media files (local only — not present on Render)
_ig_media_dir = Path(__file__).parent / "data" / "instagram-_be" / "media"
if _ig_media_dir.exists():
    app.mount("/static/ig", StaticFiles(directory=str(_ig_media_dir)), name="ig_media")
    print("[startup] Instagram media static files mounted at /static/ig")


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "ml_model_loaded": app.state.model is not None,
    }