# ADR-002: Strategy Pattern for the Ingestion Layer

## Status
Accepted — 2026-03-03

## Context

The platform needs real per-reel Instagram metrics to power analytics and ML. These require the Instagram Graph API, which in turn requires Meta Business account verification. That verification process was blocked during development, making it impossible to build against live data.

Development still needed to proceed. We needed a way to ingest data now while preserving a clean upgrade path to the Graph API later — without coupling business logic to the data source.

## Decision

We implement the ingestion layer using the **Strategy pattern** via an abstract base class:

```python
class BaseIngestionClient(ABC):
    def fetch_reels(self) -> List[Dict]
    def fetch_insights(self, reel_id: str) -> Dict
```

All data sources implement this interface. The active client is injected in `ingestion_controller.py`. Switching sources requires changing one line.

**Current implementations:**
- `InstagramExportClient` — reads from local Instagram data export (80 real reels); estimates per-reel metrics from aggregate account totals
- `InstagramClient` — Graph API implementation, stubbed and ready to activate

## Alternatives Considered

**Hardcoded CSV loading in the controller** — simpler, but couples the controller to the data source. Switching to the Graph API would require touching business logic.

**Environment-flag branching** (`if DEV: use_csv else: use_api`) — works but adds conditional complexity throughout the codebase rather than isolating it at the boundary.

## Consequences

**Positive**
- Switching to the Graph API requires changing one line in `ingestion_controller.py` — no business logic touched
- Each client is independently testable
- The interface makes the contract explicit — any future data source (a third-party analytics tool, a CSV from a different export format) just implements the same two methods

**Negative**
- Per-reel metrics from the export are estimated, not real — engagement and views are distributed from account-level aggregates using exponential weighting
- Duration (avg watch time per reel) is null for all export-sourced reels; this field requires the Graph API
