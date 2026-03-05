"""
Instagram Graph API ingestion client.

Implements BaseIngestionClient.

Prerequisites:
  1. Complete Meta Developer app setup and verify your account.
  2. Link a Facebook Page to your Instagram Creator/Business account.
  3. Request permissions: instagram_basic, instagram_manage_insights.
  4. Generate a long-lived access token and set in .env:
       IG_ACCESS_TOKEN=<token>
       IG_USER_ID=<instagram_user_id>

To activate:
  In controllers/ingestion_controller.py, replace:
      client = InstagramExportClient()
  with:
      client = InstagramClient()
"""

import requests
from typing import List, Dict, Any

from integrations.base_client import BaseIngestionClient
from core.config import settings

GRAPH_BASE   = "https://graph.facebook.com/v19.0"
REEL_FIELDS  = "id,caption,timestamp,media_type,permalink"
INSIGHT_METRICS = "impressions,reach,saved,shares,video_views,total_interactions"


class InstagramClient(BaseIngestionClient):
    """
    Fetches real reel data and insights from the Instagram Graph API.
    Implements BaseIngestionClient.
    """

    def __init__(self):
        self.token   = settings.IG_ACCESS_TOKEN
        self.user_id = settings.IG_USER_ID

        if not self.token or not self.user_id:
            raise ValueError(
                "IG_ACCESS_TOKEN and IG_USER_ID must be set in your .env file."
            )

    def _get(self, url: str, params: dict) -> dict:
        params["access_token"] = self.token
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()

    def fetch_reels(self) -> List[Dict[str, Any]]:
        """Fetch all Reels from the authenticated Instagram account."""
        url  = f"{GRAPH_BASE}/{self.user_id}/media"
        data = self._get(url, {"fields": REEL_FIELDS, "limit": 50})

        reels = []
        for item in data.get("data", []):
            if item.get("media_type") != "VIDEO":
                continue
            reels.append({
                "id":         item["id"],
                "caption":    item.get("caption", ""),
                # Fields not returned by the Graph API — tag manually via the dashboard
                "hook_text":  None,
                "duration":   None,
                "category":   None,
                "audio_type": None,
                "posted_at":  item.get("timestamp"),
            })

        return reels

    def fetch_insights(self, reel_id: str) -> Dict[str, Any]:
        """Fetch lifetime performance metrics for a single reel."""
        url  = f"{GRAPH_BASE}/{reel_id}/insights"
        data = self._get(url, {"metric": INSIGHT_METRICS, "period": "lifetime"})

        metrics = {
            m["name"]: m["values"][0]["value"]
            for m in data.get("data", [])
        }

        return {
            "impressions":  metrics.get("impressions"),
            "reach":        metrics.get("reach"),
            "engagement":   metrics.get("total_interactions"),
            "saves":        metrics.get("saved"),
            "shares":       metrics.get("shares"),
            "video_views":  metrics.get("video_views"),
        }
