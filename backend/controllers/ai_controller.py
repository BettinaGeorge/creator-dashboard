from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from core.database import get_db
from services.ai_service import (
    generate_hooks,
    generate_brief,
    generate_strategy_advice,
    generate_series,
    generate_trend_scout,
)
from services.analytics_service import get_summary, get_category_performance

router = APIRouter(prefix="/ai", tags=["ai"])

VALID_NICHES = {"Fitness", "Beauty", "Lifestyle", "Fashion", "Faith", "Travel", "Storytelling"}


class HookRequest(BaseModel):
    niche: str
    angle: str


class BriefRequest(BaseModel):
    niche: str
    idea: str


class SeriesRequest(BaseModel):
    concept: str
    episode_count: Optional[int] = 5


class TrendRequest(BaseModel):
    niche: str


def _check_key():
    from core.config import settings
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")


@router.post("/hooks")
def hooks(body: HookRequest):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    return generate_hooks(body.niche, body.angle)


@router.post("/brief")
def brief(body: BriefRequest):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    return generate_brief(body.niche, body.idea)


@router.post("/strategy")
def strategy(db: Session = Depends(get_db)):
    _check_key()
    summary = get_summary(db, source="personal")
    cats    = get_category_performance(db, source="personal")

    cat_str = ", ".join(
        f"{c['category']} ({c['reel_count']} reels, avg {c['avg_views']} views)"
        for c in cats[:4]
    )

    return generate_strategy_advice({
        "total_reels":          summary.get("total_reels", 0),
        "total_views":          summary.get("total_views", 0),
        "avg_views":            summary.get("avg_views", 0),
        "avg_engagement_rate":  summary.get("avg_engagement_rate", 0),
        "avg_saves":            summary.get("avg_saves", 0),
        "categories":           cat_str,
    })


@router.post("/series")
def series(body: SeriesRequest):
    _check_key()
    if body.episode_count < 2 or body.episode_count > 10:
        raise HTTPException(status_code=422, detail="episode_count must be between 2 and 10")
    return generate_series(body.concept, body.episode_count)


@router.post("/trends")
def trends(body: TrendRequest):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    return generate_trend_scout(body.niche)
