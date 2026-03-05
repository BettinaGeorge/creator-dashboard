"""
Instagram Data Export ingestion client.

Reads from a local Instagram data export downloaded from accountscenter.instagram.com.
Loads 80 real reels with actual captions and timestamps.

Metrics are estimated from real aggregate account data (content_interactions.json)
since the export does not include per-reel performance breakdowns.
Per-reel metrics require the Instagram Graph API.

Also loads the viral shorts dataset for supplemental analytics coverage.
"""

import json
import re
import uuid
import random
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

from integrations.base_client import BaseIngestionClient

BASE_DIR   = Path(__file__).resolve().parent.parent
EXPORT_DIR = BASE_DIR / "data" / "instagram-_be"
REELS_JSON = EXPORT_DIR / "your_instagram_activity" / "media" / "reels.json"
VIRAL_PATH = BASE_DIR / "data" / "viral_shorts_reels_performance_dataset.csv"

# Real aggregate metrics from content_interactions.json (Dec 4 – Mar 3)
AGGREGATE = {
    "likes":    4860,
    "comments":  304,
    "shares":    109,
    "saves":     113,
}

# Estimated engagement rate (likes / views) for Reels — typical 2–5%
ENGAGEMENT_RATE = 0.03

MEDIA_BASE_URL = "/static/ig"

HOOK_TEMPLATES = {
    "Motivation": "this mindset shift changed everything for me",
    "Tech":       "everyone should know this one trick",
    "Travel":     "POV: you just landed here for the first time",
    "Fitness":    "day 1 vs 30 days later",
    "Food":       "this recipe changed my entire week",
    "Fashion":    "outfit that hits different every time",
    "Comedy":     "when you finally realize...",
    "Lifestyle":  "morning routine that actually works",
    "Beauty":     "this skincare routine costs almost nothing",
    "Education":  "learned this in 5 minutes, wish I knew it sooner",
    "Finance":    "I wish someone told me this at 20",
}


def _decode(text: str) -> str:
    """Fix mojibake unicode in Instagram exports (ð\x9f\x92\x80 → 💀)."""
    try:
        return text.encode("raw_unicode_escape").decode("utf-8")
    except Exception:
        return text


def _extract_id(uri: str) -> str:
    """Extract numeric ID from URI like 'media/reels/202602/18152437057450449.mp4'."""
    return Path(uri).stem


def _extract_yyyymm(uri: str) -> str:
    """Extract YYYYMM folder from URI like 'media/reels/202602/...'."""
    parts = Path(uri).parts
    return parts[2] if len(parts) >= 4 else ""


def _infer_category(caption: str) -> str:
    lower = caption.lower()
    # Nigerian/African student life — most specific, check first
    if any(w in lower for w in ["nigerian", "african", "naija", "diaspora", "pwi", "continent", "siblings", "naij"]):
        return "Nigerian Student"
    # College/student life (broader)
    if any(w in lower for w in ["college", "school", "campus", "internship", "pre-med", "student"]):
        return "Nigerian Student"
    # Tech & Career
    if any(w in lower for w in ["career", "tech", "intern", "job", "startup", "engineering"]):
        return "Tech/Career"
    # Beauty
    if any(w in lower for w in ["skincare", "beauty", "makeup", "neutrogena", "glam", "moistur", "toner", "serum"]):
        return "Beauty"
    # Fitness
    if any(w in lower for w in ["fitness", "workout", "gym", "body", "health", "flex", "culprit"]):
        return "Fitness"
    # Food
    if any(w in lower for w in ["food", "recipe", "eat", "cook", "meal"]):
        return "Food"
    # Travel
    if any(w in lower for w in ["travel", "trip", "visit", "explore", "country", "landed", "flight"]):
        return "Travel"
    # Fashion
    if any(w in lower for w in ["fashion", "outfit", "style", "ootd", "clothes", "dressed", "fit "]):
        return "Fashion"
    # Me/Personality — content about self, confidence, identity
    if any(w in lower for w in ["insecur", "confid", "why do i", "why do you", "content creator", "create content", "again "]):
        return "Me/Personality"
    return "Me/Personality"  # default for personal lifestyle content


def _distribute_metrics(n: int, seed: int = 42) -> List[Dict[str, int]]:
    """
    Distribute real aggregate totals across n reels using an exponential
    distribution — a few reels go viral, most have modest reach.
    """
    rng = random.Random(seed)
    raw = [rng.expovariate(1.0) for _ in range(n)]
    total = sum(raw)
    norm = [w / total for w in raw]

    result = []
    for w in norm:
        likes      = max(0, round(AGGREGATE["likes"]    * w))
        comments   = max(0, round(AGGREGATE["comments"] * w))
        shares     = max(0, round(AGGREGATE["shares"]   * w))
        saves      = max(0, round(AGGREGATE["saves"]    * w))
        engagement = likes + comments + shares + saves
        video_views = max(likes * 10, round(engagement / ENGAGEMENT_RATE))
        reach       = round(video_views * 0.88)
        impressions = round(video_views * 1.12)
        result.append({
            "impressions": impressions,
            "reach":       reach,
            "engagement":  engagement,
            "saves":       saves,
            "shares":      shares,
            "video_views": video_views,
        })
    return result


class InstagramExportClient(BaseIngestionClient):
    """
    Ingestion client backed by a local Instagram data export.

    Loads real reels (captions, timestamps, video files) from the export,
    then supplements with the viral shorts dataset for analytics coverage.

    Implements BaseIngestionClient.
    """

    def __init__(self):
        self._records: List[Dict[str, Any]] = []
        self._load_export_reels()
        self._load_viral_dataset()

    def _load_export_reels(self):
        if not REELS_JSON.exists():
            print(f"[ExportClient] reels.json not found at {REELS_JSON}")
            return

        with open(REELS_JSON, "r") as f:
            data = json.load(f)

        reels_raw = data.get("ig_reels_media", [])
        metrics   = _distribute_metrics(len(reels_raw))

        for i, entry in enumerate(reels_raw):
            media   = entry.get("media", [{}])[0]
            uri     = media.get("uri", "")
            reel_id = _extract_id(uri)
            yyyymm  = _extract_yyyymm(uri)
            caption = _decode(media.get("title", "") or "")
            ts      = media.get("creation_timestamp")

            posted_at = None
            if ts:
                posted_at = datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)

            # First line of caption = hook text
            hook = caption.split("\n")[0].strip()
            # Strip @mentions and hashtags from hook
            hook = re.sub(r'[@#]\S+', '', hook).strip() or None

            video_url = f"{MEDIA_BASE_URL}/reels/{yyyymm}/{reel_id}.mp4" if yyyymm else None

            self._records.append({
                "reel": {
                    "id":        reel_id,
                    "caption":   caption or None,
                    "hook_text": hook,
                    "duration":  None,
                    "category":  _infer_category(caption),
                    "audio_type": None,
                    "posted_at": posted_at,
                    "source":    "personal",
                    "video_url": video_url,
                },
                "insight": metrics[i],
            })

        print(f"[ExportClient] Loaded {len(self._records)} real reels from Instagram export")

    def _load_viral_dataset(self):
        if not VIRAL_PATH.exists():
            return

        count_before = len(self._records)
        df = pd.read_csv(VIRAL_PATH)

        for _, row in df.iterrows():
            niche  = str(row.get("niche", "Lifestyle"))
            views  = int(row.get("views_total", 0))
            reach       = round(views * 0.90)
            impressions = round(views * 1.15)
            engagement  = round(views * 0.08)
            saves       = round(engagement * 0.15)
            shares      = round(engagement * 0.10)

            posted_at = None
            try:
                posted_at = pd.to_datetime(row["upload_time"]).to_pydatetime()
            except Exception:
                pass

            self._records.append({
                "reel": {
                    "id":         str(row.get("video_id", uuid.uuid4())),
                    "caption":    f"{niche} content",
                    "hook_text":  HOOK_TEMPLATES.get(niche, "watch until the end"),
                    "duration":   int(row.get("duration_sec", 15)),
                    "category":   niche,
                    "audio_type": str(row.get("music_type", "Trending")),
                    "posted_at":  posted_at,
                    "source":     "synthetic",
                    "video_url":  None,
                },
                "insight": {
                    "impressions":  impressions,
                    "reach":        reach,
                    "engagement":   engagement,
                    "saves":        saves,
                    "shares":       shares,
                    "video_views":  views,
                },
            })

        added = len(self._records) - count_before
        print(f"[ExportClient] Loaded {added} synthetic reels from viral dataset")

    def fetch_reels(self) -> List[Dict[str, Any]]:
        return [r["reel"] for r in self._records]

    def fetch_insights(self, reel_id: str) -> Dict[str, Any]:
        for record in self._records:
            if record["reel"]["id"] == reel_id:
                return record["insight"]
        return {}
