# ADR-001: Modular Full-Stack Architecture for Creator Analytics Platform

## Status
Accepted — Updated 2026-03-04

## Date
Originally: 2026-03-03
Last updated: 2026-03-04

---

## Context

The Creator Content Analytics & Prediction Platform is designed to:

- Ingest Instagram Reel performance metrics
- Store and normalize engagement data in a relational database
- Provide historical analytics and insight extraction
- Support machine learning-driven performance prediction before posting

The system must achieve three goals:

1. Demonstrate technical software engineering depth
2. Showcase applied machine learning and data reasoning
3. Be architecturally scalable toward a future SaaS product

The previous implementation lacked clear separation of concerns and long-term structural clarity. A redesign is required to ensure modularity, maintainability, and scalability.

---

## Decision

We implement a layered architecture with strict separation of concerns:

- **Frontend:** Next.js (TypeScript)
- **Backend API:** FastAPI (Python)
- **Database:** PostgreSQL
- **ML Module:** Dedicated Python service layer
- **Integration Layer:** Pluggable ingestion client interface

Each layer has a single responsibility and clear boundaries.

---

## Architectural Overview

### High-Level System Flow

```
Data Source (CSV / Instagram API)
    ↓
Ingestion Layer (BaseIngestionClient interface)
    ↓
Service Layer → Repository Layer → PostgreSQL

Frontend (Next.js)
    ↓  HTTP/JSON
Controller Layer
    ↓
Service Layer
    ↓
Repository Layer → PostgreSQL
         └── ML Layer → Prediction Response
```

---

## Layered Architecture

### 1. Frontend Layer

**Technology:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

**Responsibilities:**
- UI rendering and data visualization
- Form input and interaction handling
- API communication via typed fetch client (`src/lib/api.ts`)
- Theme management (dark/light toggle with `data-theme` attribute)

**Constraints:**
- No business logic
- No database access
- No ML execution
- All communication goes through backend endpoints

**Pages implemented:**
- `/` — Overview dashboard with KPI cards, growth trend, top reels
- `/reels` — Personal reels library grid
- `/reels/[id]` — Individual reel detail and engagement breakdown
- `/predict` — ML prediction form
- `/strategy` — Category and audio type performance analysis

---

### 2. Backend API Layer

**Technology:** FastAPI (Python)

Responsible for HTTP routing, request validation, and response formatting.

```
backend/
├── controllers/       # Route handlers only — no logic, no SQL
├── services/          # Business logic, analytics, ML orchestration
├── repositories/      # All database queries live here
├── models/            # SQLAlchemy ORM table definitions
├── schemas/           # Pydantic request/response contracts
├── integrations/      # Pluggable ingestion client interface
├── ml/                # Model training, prediction, feature engineering
└── core/              # Config, database engine, session management
```

---

### 3. Controller Layer

**Responsibilities:**
- Define API endpoints
- Validate request payloads (via Pydantic schemas)
- Pass to service layer
- Format and return responses

**Implemented controllers:**
- `reel_controller.py` — `GET/POST /reels`, `GET /reels/{id}`
- `reel_insight_controller.py` — `POST /insights`, `GET /reels/{id}/insights`
- `analytics_controller.py` — all `/analytics/*` endpoints
- `prediction_controller.py` — `POST /predict/`
- `ingestion_controller.py` — `POST /ingest/`, `DELETE /ingest/clear`

**Constraints:**
- No business logic
- No direct SQL queries
- No ML execution

---

### 4. Service Layer

Business logic lives exclusively here.

**Responsibilities:**
- Engagement rate calculation and metric derivation
- Data transformation and normalization
- Feature engineering for ML input
- Insight generation (category performance, audio type ranking, growth trend)
- ML orchestration (calling predictor, packaging response)
- Ingestion orchestration (idempotent upsert via `ingestion_service.py`)

**Analytics functions implemented:**
- `get_summary(db, source)` — aggregated KPIs with optional source filter
- `get_category_performance(db)` — avg views/engagement by category
- `get_audio_type_performance(db)` — avg views/engagement by audio type
- `get_top_performing_reels(db, limit, source)` — ranked by views
- `get_growth_data(db, source)` — chronological views for trend chart
- `get_top_performing_hooks()` — niche/hook benchmarks from training dataset

---

### 5. Repository Layer

**Responsibilities:**
- All SQLAlchemy CRUD operations
- Query filtering (including `source` field)
- Joins and eager loading (e.g., reels with insights)

**Constraints:**
- No business logic
- No ML logic
- No HTTP handling

Isolation here ensures any future ORM migration or database swap touches only this layer.

---

### 6. Integration Layer

**Design:** Strategy pattern via abstract base class.

```python
class BaseIngestionClient(ABC):
    def fetch_reels(self) -> List[Dict]
    def fetch_insights(self, reel_id: str) -> Dict
```

All data sources implement this interface. The ingestion service depends only on `BaseIngestionClient` — it never knows which concrete implementation it's calling.

**Implementations:**

| Client | Status | Description |
|--------|--------|-------------|
| `SeedClient` | Active | Reads `ig_content_log.csv` (personal) + viral shorts dataset. Tags personal reels as `source=personal`. |
| `InstagramClient` | Stubbed | Instagram Graph API implementation. Requires `IG_ACCESS_TOKEN` and `IG_USER_ID`. Ready to activate. |

**Pivot from original design:** The original ADR assumed direct Instagram Graph API ingestion. During development, Meta Developer account verification was blocked. Rather than blocking the entire system, we introduced the strategy pattern so ingestion could proceed with seed data while preserving a clean upgrade path to the real API. To switch: replace `SeedClient()` with `InstagramClient()` in `ingestion_controller.py`. No other code changes required.

**Idempotency:** `ingestion_service.run_ingestion()` checks for existing reel IDs before inserting. Re-running ingestion skips duplicates and returns a `{created, skipped, failed}` report.

---

### 7. ML Layer

**Technology:** scikit-learn (RandomForestRegressor)

```
ml/
├── train_model.py    # Training script — reads dataset, trains, saves artifacts
├── predictor.py      # Prediction logic + recommendation engine
├── features.py       # Feature engineering utilities
├── model.pkl         # Serialized trained model
└── features.pkl      # Saved feature column order (for alignment at inference)
```

**Features used at training and inference:**
- `duration_sec` — reel length
- `hook_strength_score` — 0.0–1.0 signal strength
- `niche` — content category (one-hot encoded)
- `music_type` — audio type (one-hot encoded)
- `is_weekend` — binary posting day flag

**Target:** `views_total`

**Model selection rationale:** The training dataset is 400 rows. RandomForest handles tabular data well at this scale, avoids overfitting through ensemble averaging, and does not require feature scaling. Neural approaches would overfit on this volume.

**Inference:** Model is loaded once at application startup via `joblib`. If the model file is absent, startup continues with a warning — the prediction endpoint returns an error, but all other endpoints remain functional.

**Constraints:**
- No database access
- No HTTP logic
- Called only from the service layer

---

## Database Schema

### `reels`

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR (PK) | Instagram shortcode or generated ID |
| caption | TEXT | |
| hook_text | TEXT | Opening line / on-screen text |
| duration | INTEGER | Seconds |
| category | VARCHAR | Content niche |
| audio_type | VARCHAR | |
| posted_at | DATETIME | |
| **source** | **VARCHAR** | **`personal` or `synthetic` — added to support data origin filtering** |
| created_at | DATETIME | |

### `reel_insights`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER (PK) | Auto-increment |
| reel_id | VARCHAR (FK) | References reels.id |
| impressions | INTEGER | |
| reach | INTEGER | |
| engagement | INTEGER | Likes + comments + saves + shares |
| saves | INTEGER | |
| shares | INTEGER | |
| video_views | INTEGER | |
| snapshot_time | DATETIME | |

**Note on `predictions` table:** The original design included a `predictions` table to log model outputs for drift detection and retraining. This was deferred — predictions are currently stateless (computed on request, not persisted). The table will be added when prediction history and model performance tracking become a priority.

---

## Design Principles

1. **Strict separation of concerns** — each layer has one job
2. **High testability** — repositories and services are independently testable
3. **Modular ML integration** — ML is callable from service layer only
4. **Pluggable data sources** — strategy pattern isolates ingestion from business logic
5. **Production-ready organization** — folder structure mirrors how this would scale to a multi-developer team

---

## Consequences

### Positive

- Clean, navigable codebase with predictable responsibility boundaries
- Ingestion source is swappable in one line — Instagram API, third-party tools, or other exports all supported without structural change
- `source` field enables mixed-data architecture: personal metrics for creator-facing views, full dataset for ML and analytics
- ML model is isolated and independently retrained without touching application code
- Architecture is directly extensible to multi-user SaaS

### Negative

- More files and layers than a simpler script-based approach
- Requires discipline to enforce layer boundaries as the codebase grows
- `predictions` table deferred — model performance cannot currently be tracked over time

---

## Future Extensions

- Activate `InstagramClient` once Meta Developer verification is complete
- Add `predictions` table and log all model outputs for retraining pipeline
- Introduce Alembic for managed schema migrations before multi-developer collaboration
- Add scheduled ingestion (APScheduler or Celery) for automated metric refresh
- SHAP values for per-prediction feature explainability
- Multi-user support with OAuth and per-user data isolation
- SaaS subscription architecture
