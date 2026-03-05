from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from core.database import get_db
from services.ai_service import (
    build_data_context,
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
    planner_context: Optional[str] = ""


class BriefRequest(BaseModel):
    niche: str
    idea: str
    planner_context: Optional[str] = ""


class SeriesRequest(BaseModel):
    concept: str
    episode_count: Optional[int] = 5
    planner_context: Optional[str] = ""


class TrendRequest(BaseModel):
    niche: str
    planner_context: Optional[str] = ""


class StrategyRequest(BaseModel):
    planner_context: Optional[str] = ""


def _check_key():
    from core.config import settings
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")


def _build_ctx(db: Session, planner_context: str = "") -> str:
    ctx = build_data_context(db)
    if planner_context:
        ctx += f"\n\n{planner_context}"
    return ctx


@router.post("/hooks")
def hooks(body: HookRequest, db: Session = Depends(get_db)):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    ctx = _build_ctx(db, body.planner_context or "")
    return generate_hooks(body.niche, body.angle, data_context=ctx)


@router.post("/brief")
def brief(body: BriefRequest, db: Session = Depends(get_db)):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    ctx = _build_ctx(db, body.planner_context or "")
    return generate_brief(body.niche, body.idea, data_context=ctx)


@router.post("/strategy")
def strategy(body: StrategyRequest = StrategyRequest(), db: Session = Depends(get_db)):
    _check_key()
    summary = get_summary(db, source="personal")
    cats    = get_category_performance(db, source="personal")

    cat_str = ", ".join(
        f"{c['category']} ({c['reel_count']} reels, avg {c['avg_views']} views)"
        for c in cats[:4]
    )

    ctx = _build_ctx(db, body.planner_context or "")
    return generate_strategy_advice({
        "total_reels":          summary.get("total_reels", 0),
        "total_views":          summary.get("total_views", 0),
        "avg_views":            summary.get("avg_views", 0),
        "avg_engagement_rate":  summary.get("avg_engagement_rate", 0),
        "avg_saves":            summary.get("avg_saves", 0),
        "categories":           cat_str,
    }, data_context=ctx)


@router.post("/series")
def series(body: SeriesRequest, db: Session = Depends(get_db)):
    _check_key()
    if body.episode_count < 2 or body.episode_count > 10:
        raise HTTPException(status_code=422, detail="episode_count must be between 2 and 10")
    ctx = _build_ctx(db, body.planner_context or "")
    return generate_series(body.concept, body.episode_count, data_context=ctx)


@router.post("/trends")
def trends(body: TrendRequest, db: Session = Depends(get_db)):
    _check_key()
    if body.niche not in VALID_NICHES:
        raise HTTPException(status_code=422, detail=f"niche must be one of {VALID_NICHES}")
    ctx = _build_ctx(db, body.planner_context or "")
    return generate_trend_scout(body.niche, data_context=ctx)
