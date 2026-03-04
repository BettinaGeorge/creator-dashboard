from sqlalchemy.orm import Session
from sqlalchemy import func
from repositories.reel_repository import get_reel_with_insights
from models.reel import Reel
from models.reel_insight import ReelInsight
import pandas as pd
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "viral_shorts_reels_performance_dataset.csv"


def get_top_performing_hooks():

    df = pd.read_csv(DATA_PATH)

    # Calculate engagement score proxy
    df["performance_score"] = df["views_total"]

    # Top niches
    top_niches = (
        df.groupby("niche")["performance_score"]
        .mean()
        .sort_values(ascending=False)
        .head(5)
        .to_dict()
    )

    # Top audio types
    top_audio = (
        df.groupby("music_type")["performance_score"]
        .mean()
        .sort_values(ascending=False)
        .head(5)
        .to_dict()
    )

    # Hook strength ranges
    hook_ranges = (
        df.groupby(pd.cut(df["hook_strength_score"], bins=5))["performance_score"]
        .mean()
        .sort_values(ascending=False)
        .to_dict()
    )

    return {
        "top_niches": top_niches,
        "top_audio_types": top_audio,
        "best_hook_strength_ranges": {str(k): v for k, v in hook_ranges.items()}
    }

def compute_reel_analytics(db: Session, reel_id: str):
    reel = get_reel_with_insights(db, reel_id)

    if not reel or not reel.insights:
        return None

    latest = reel.insights[-1]

    impressions = latest.impressions or 0
    engagement = latest.engagement or 0
    saves = latest.saves or 0
    shares = latest.shares or 0
    views = latest.video_views or 0

    if impressions == 0:
        return {
            "reel_id": reel_id,
            "engagement_rate": 0,
            "save_rate": 0,
            "share_rate": 0,
            "view_rate": 0
        }

    return {
        "reel_id": reel_id,
        "engagement_rate": engagement / impressions,
        "save_rate": saves / impressions,
        "share_rate": shares / impressions,
        "view_rate": views / impressions
    }


def get_summary(db: Session, source: str = None):
    query = db.query(
        func.count(func.distinct(Reel.id)).label("total_reels"),
        func.sum(ReelInsight.video_views).label("total_views"),
        func.sum(ReelInsight.saves).label("total_saves"),
        func.avg(ReelInsight.video_views).label("avg_views"),
        func.avg(ReelInsight.reach).label("avg_reach"),
        func.avg(ReelInsight.engagement).label("avg_engagement"),
        func.avg(ReelInsight.saves).label("avg_saves"),
        func.avg(ReelInsight.shares).label("avg_shares"),
    ).join(ReelInsight, Reel.id == ReelInsight.reel_id)

    if source:
        query = query.filter(Reel.source == source)

    result = query.first()

    if not result or not result.total_reels:
        return {
            "total_reels": 0, "total_views": 0, "total_saves": 0,
            "avg_views": 0, "avg_reach": 0, "avg_engagement": 0,
            "avg_saves": 0, "avg_shares": 0,
        }

    avg_views = result.avg_views or 0
    avg_engagement = result.avg_engagement or 0
    engagement_rate = round((avg_engagement / avg_views * 100), 2) if avg_views > 0 else 0

    return {
        "total_reels":      result.total_reels,
        "total_views":      round(result.total_views or 0),
        "total_saves":      round(result.total_saves or 0),
        "avg_views":        round(avg_views),
        "avg_reach":        round(result.avg_reach or 0),
        "avg_engagement":   round(avg_engagement),
        "avg_engagement_rate": engagement_rate,
        "avg_saves":        round(result.avg_saves or 0),
        "avg_shares":       round(result.avg_shares or 0),
    }


def get_category_performance(db: Session):
    rows = (
        db.query(
            Reel.category,
            func.avg(ReelInsight.video_views).label("avg_views"),
            func.avg(ReelInsight.engagement).label("avg_engagement"),
            func.count(Reel.id).label("reel_count"),
        )
        .join(ReelInsight, Reel.id == ReelInsight.reel_id)
        .filter(Reel.category.isnot(None))
        .group_by(Reel.category)
        .order_by(func.avg(ReelInsight.video_views).desc())
        .all()
    )

    return [
        {
            "category":       row.category,
            "avg_views":      round(row.avg_views or 0),
            "avg_engagement": round(row.avg_engagement or 0),
            "reel_count":     row.reel_count,
        }
        for row in rows
    ]


def get_audio_type_performance(db: Session):
    rows = (
        db.query(
            Reel.audio_type,
            func.avg(ReelInsight.video_views).label("avg_views"),
            func.avg(ReelInsight.engagement).label("avg_engagement"),
            func.count(Reel.id).label("reel_count"),
        )
        .join(ReelInsight, Reel.id == ReelInsight.reel_id)
        .filter(Reel.audio_type.isnot(None))
        .group_by(Reel.audio_type)
        .order_by(func.avg(ReelInsight.video_views).desc())
        .all()
    )

    return [
        {
            "audio_type":     row.audio_type,
            "avg_views":      round(row.avg_views or 0),
            "avg_engagement": round(row.avg_engagement or 0),
            "reel_count":     row.reel_count,
        }
        for row in rows
    ]


def get_top_performing_reels(db: Session, limit: int = 10, source: str = None):
    query = (
        db.query(Reel, ReelInsight.video_views, ReelInsight.engagement)
        .join(ReelInsight, Reel.id == ReelInsight.reel_id)
    )
    if source:
        query = query.filter(Reel.source == source)
    rows = query.order_by(ReelInsight.video_views.desc()).limit(limit).all()

    return [
        {
            "reel_id":    reel.id,
            "hook_text":  reel.hook_text,
            "category":   reel.category,
            "audio_type": reel.audio_type,
            "video_views": views,
            "engagement":  engagement,
        }
        for reel, views, engagement in rows
    ]


def get_growth_data(db: Session, source: str = None):
    """Reels ordered chronologically with their view counts — used for the growth trend chart."""
    query = (
        db.query(Reel.id, Reel.posted_at, Reel.hook_text, ReelInsight.video_views)
        .join(ReelInsight, Reel.id == ReelInsight.reel_id)
        .filter(Reel.posted_at.isnot(None))
    )
    if source:
        query = query.filter(Reel.source == source)

    rows = query.order_by(Reel.posted_at.asc()).all()

    return [
        {
            "reel_id":     r[0],
            "posted_at":   r[1].isoformat() if r[1] else None,
            "hook_text":   r[2],
            "video_views": r[3],
        }
        for r in rows
    ]