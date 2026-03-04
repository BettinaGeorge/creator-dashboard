"""
Seed ingestion client backed by local CSV files.

Data sources:
  - ig_content_log.csv       : Personal Instagram reels with real metrics
  - viral_shorts_reels_...   : Supplemental dataset for broader analytics coverage

Implements BaseIngestionClient — drop-in replacement for InstagramClient.
"""

import re
import uuid
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional

from integrations.base_client import BaseIngestionClient

BASE_DIR = Path(__file__).resolve().parent.parent
IG_LOG_PATH = BASE_DIR / "data" / "ig_content_log.csv"
VIRAL_DATASET_PATH = BASE_DIR / "data" / "viral_shorts_reels_performance_dataset.csv"

# Default hook text by niche for synthetic records from the viral dataset
HOOK_TEMPLATES = {
    "Motivation":  "this mindset shift changed everything for me",
    "Tech":        "everyone should know this one trick",
    "Travel":      "POV: you just landed here for the first time",
    "Fitness":     "day 1 vs 30 days later",
    "Food":        "this recipe changed my entire week",
    "Fashion":     "outfit that hits different every time",
    "Comedy":      "when you finally realize...",
    "Lifestyle":   "morning routine that actually works",
    "Beauty":      "this skincare routine costs almost nothing",
    "Education":   "learned this in 5 minutes, wish I knew it sooner",
    "Finance":     "I wish someone told me this at 20",
}


def _parse_int(val) -> Optional[int]:
    """Parse integers that may contain comma-formatted strings (e.g. '21,490')."""
    try:
        return int(str(val).replace(",", "").strip())
    except (ValueError, AttributeError):
        return None


def _extract_reel_id(post_link: str) -> Optional[str]:
    """Extract the reel shortcode from an Instagram permalink."""
    if not isinstance(post_link, str) or not post_link.strip():
        return None
    match = re.search(r"/reel/([A-Za-z0-9_-]+)", post_link)
    return match.group(1) if match else None


class SeedClient(BaseIngestionClient):
    """
    Ingestion client backed by local CSV files.

    Loads personal IG export data (real metrics) and supplements with a
    viral shorts dataset for broader analytics coverage.

    The interface is identical to InstagramClient — replace SeedClient()
    with InstagramClient() in ingestion_controller.py when the Graph API
    is ready. No other code changes required.
    """

    def __init__(self):
        self._records: List[Dict[str, Any]] = []
        self._load_ig_log()
        self._load_viral_dataset()

    def _load_ig_log(self):
        """Load personal Instagram content log (real data)."""
        if not IG_LOG_PATH.exists():
            print(f"[SeedClient] ig_content_log.csv not found at {IG_LOG_PATH}, skipping.")
            return

        df = pd.read_csv(IG_LOG_PATH)
        df = df[df["post_type"] == "Reel"].copy()

        for _, row in df.iterrows():
            reel_id = (
                _extract_reel_id(str(row.get("post_link", "")))
                or str(uuid.uuid4())[:12]
            )

            views    = _parse_int(row.get("views", 0)) or 0
            reach    = _parse_int(row.get("reach", 0)) or 0
            likes    = _parse_int(row.get("likes", 0)) or 0
            comments = _parse_int(row.get("comments", 0)) or 0
            shares   = _parse_int(row.get("shares", 0)) or 0
            saves    = _parse_int(row.get("saves", 0)) or 0
            engagement  = likes + comments + shares + saves
            # Impressions typically exceed views; apply a conservative multiplier
            impressions = round(views * 1.15)

            posted_at = None
            try:
                posted_at = pd.to_datetime(row["post_date"]).to_pydatetime()
            except Exception:
                pass

            caption = " — ".join(filter(None, [
                str(row.get("topic", "")).strip(),
                str(row.get("caption_intent", "")).strip(),
            ]))

            self._records.append({
                "reel": {
                    "id":         reel_id,
                    "caption":    caption or None,
                    "hook_text":  str(row.get("hook_text", "")).strip() or None,
                    "duration":   _parse_int(row.get("avg. watch time", None)),
                    "category":   str(row.get("pillar", "")).strip() or None,
                    "audio_type": str(row.get("audio_type", "")).strip() or None,
                    "posted_at":  posted_at,
                    "source":     "personal",
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

        print(f"[SeedClient] Loaded {len(self._records)} personal reels from ig_content_log.csv")

    def _load_viral_dataset(self):
        """Load supplemental viral shorts dataset (synthetic records)."""
        if not VIRAL_DATASET_PATH.exists():
            print(f"[SeedClient] viral dataset not found at {VIRAL_DATASET_PATH}, skipping.")
            return

        count_before = len(self._records)
        df = pd.read_csv(VIRAL_DATASET_PATH)

        for _, row in df.iterrows():
            niche  = str(row.get("niche", "Lifestyle"))
            views  = int(row.get("views_total", 0))

            # Derive realistic metric ratios from total views
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
        print(f"[SeedClient] Loaded {added} synthetic reels from viral dataset")

    # ------------------------------------------------------------------ #
    # BaseIngestionClient interface                                        #
    # ------------------------------------------------------------------ #

    def fetch_reels(self) -> List[Dict[str, Any]]:
        return [r["reel"] for r in self._records]

    def fetch_insights(self, reel_id: str) -> Dict[str, Any]:
        for record in self._records:
            if record["reel"]["id"] == reel_id:
                return record["insight"]
        return {}
