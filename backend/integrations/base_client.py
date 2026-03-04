from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseIngestionClient(ABC):
    """
    Abstract interface for reel data ingestion.

    Any data source (seed CSV, Instagram Graph API, etc.) implements this
    interface. The ingestion service depends only on this contract, so the
    data source can be swapped without touching business logic.
    """

    @abstractmethod
    def fetch_reels(self) -> List[Dict[str, Any]]:
        """
        Return a list of reel metadata dicts.
        Each dict must conform to ReelCreate schema:
            id (str), caption (str), hook_text (str),
            duration (int), category (str), audio_type (str), posted_at (datetime | None)
        """
        pass

    @abstractmethod
    def fetch_insights(self, reel_id: str) -> Dict[str, Any]:
        """
        Return performance metrics for a given reel ID.
        Returned dict must conform to ReelInsightCreate schema:
            impressions (int), reach (int), engagement (int),
            saves (int), shares (int), video_views (int)
        """
        pass
