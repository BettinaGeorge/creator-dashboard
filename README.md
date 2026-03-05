# Creator Content Analytics & Performance Prediction

A full-stack content intelligence platform built for Instagram creators. Ingests reel metadata and engagement metrics, performs analytics across content categories and audio types, and uses a trained machine learning model to predict reel performance before posting.

> **Status:** Fully functional — backend complete, frontend wired to live data.
>
> **Live Demo:** [creator-dashboard-indol.vercel.app](https://creator-dashboard-indol.vercel.app/)

---

## What It Does

1. **Ingests** reel data from a pluggable ingestion layer (currently CSV-backed; Instagram Graph API ready)
2. **Stores** structured reel metadata and multi-field engagement metrics in PostgreSQL
3. **Analyzes** performance patterns across categories, audio types, hook text, and growth over time
4. **Predicts** reel performance before posting using a trained RandomForest regression model
5. **Displays** insights in a creator-facing analytics dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy ORM |
| ML | scikit-learn (RandomForestRegressor) |
| Data | Personal Instagram export + viral shorts dataset (400 rows) |

---

## Architecture

```
          CREATOR ANALYTICS DASHBOARD  ·  System Architecture


+------------------------------------------------------------------------------+
|                         USER INTERFACE LAYER                                 |
|                     Next.js 15  ·  TypeScript  ·  Vercel                    |
|                                                                              |
|  +-----------+  +--------------+  +---------+  +---------+  +-----------+  |
|  | Dashboard |  | Reels Library|  | Predict |  | Strategy|  | Scrapbook |  |
|  |  Overview |  |   all reels  |  | ML Form |  | Analysis|  | + Planner |  |
|  +-----------+  +--------------+  +---------+  +---------+  +-----------+  |
|                                                                              |
|                      lib/api.ts  —  typed REST client                        |
+------------------------------------------------------------------------------+
                                       |
                            REST API  /  HTTPS
                                       |
                                       ▼
+------------------------------------------------------------------------------+
|                          BACKEND API LAYER                                   |
|                      FastAPI  ·  Python  ·  Render                           |
|                                                                              |
|                              CONTROLLERS                                     |
|  +-------------------+  +---------------+  +------------+  +-------------+  |
|  |   /analytics/*    |  |   /reels/*    |  | /predict/  |  |  /ingest/   |  |
|  | summary · growth  |  | list · detail |  |    POST    |  | POST/DELETE |  |
|  | categories · audio|  | insights · top|  |            |  |             |  |
|  +-------------------+  +---------------+  +------------+  +-------------+  |
|                                       |                                      |
|                                       ▼                                      |
|                                SERVICES                                      |
|  +---------------------+  +--------------------+  +----------------------+  |
|  |  analytics_service  |  | ingestion_service  |  |     predictor.py     |  |
|  | summary · growth    |  | reel + insight     |  | RandomForest wrapper |  |
|  | categories · audio  |  | upsert · idempotent|  | recommendation engine|  |
|  +---------------------+  +--------------------+  +----------------------+  |
|                                       |                                      |
|                                       ▼                                      |
|                               REPOSITORY                                     |
|  +------------------------------------------------------------------+       |
|  |          reel_repository  —  all SQLAlchemy ORM queries          |       |
|  |      idempotent upserts · no business logic across boundary      |       |
|  +------------------------------------------------------------------+       |
+------------------------------------------------------------------------------+
                    |                                   |
             SQLAlchemy ORM                       predict_reel()
                    |                                   |
                    ▼                                   ▼
+-------------------------------+       +-------------------------------+
|         PostgreSQL            |       |          ML ENGINE            |
|         Neon  (cloud)         |       |    RandomForestRegressor      |
|                               |       |         scikit-learn          |
|   reels                       |       |                               |
|   ├── id  (PK)                |       |   Features:                   |
|   ├── hook_text               |       |   · duration_sec              |
|   ├── category                |       |   · hook_strength_score       |
|   ├── audio_type              |       |   · niche  (one-hot encoded)  |
|   └── posted_at               |       |   · music_type  (one-hot)     |
|                               |       |   · is_weekend                |
|   reel_insights               |       |                               |
|   ├── impressions             |       |   Output:                     |
|   ├── reach                   |       |   · predicted_views           |
|   ├── engagement              |       |   · virality_probability      |
|   ├── saves                   |       |   · performance_category      |
|   └── video_views             |       |   · recommendation            |
+-------------------------------+       +-------------------------------+


+------------------------------------------------------------------------------+
|                    INGESTION LAYER  ·  Strategy Pattern                      |
|                                                                              |
|  +-------------------------------------+  +--------------------------------+ |
|  |  SeedClient  ✓  (currently active)  |  | InstagramClient  ⚡  (ready)   | |
|  |                                     |  |                                | |
|  |  ig_content_log.csv                 |  | Instagram Graph API            | |
|  |  9 real personal Instagram reels    |  | awaiting IG_ACCESS_TOKEN       | |
|  |                                     |  | swap 1 line to activate        | |
|  |  viral_shorts_dataset.csv           |  |                                | |
|  |  400 rows  ·  ML model training     |  | instagram_client.py  built     | |
|  +-------------------------------------+  +--------------------------------+ |
+------------------------------------------------------------------------------+
```

The backend follows a strict **Controller → Service → Repository** pattern — no layer reaches past its boundary. The ingestion layer uses the **strategy pattern**: `SeedClient` (CSV) and `InstagramClient` (Graph API) share the same interface, making the data source swappable with one line change.

---

## Backend Structure

```
backend/
├── controllers/          # Route definitions, request/response handling
│   ├── reel_controller.py
│   ├── reel_insight_controller.py
│   ├── analytics_controller.py
│   ├── prediction_controller.py
│   └── ingestion_controller.py
├── services/             # Business logic, analytics computation, ML calls
│   ├── reel_service.py
│   ├── reel_insight_service.py
│   ├── analytics_service.py
│   ├── prediction_service.py
│   └── ingestion_service.py
├── repositories/         # SQLAlchemy CRUD, all DB queries live here
│   ├── reel_repository.py
│   └── reel_insight_repository.py
├── models/               # SQLAlchemy ORM models
│   ├── reel.py
│   └── reel_insight.py
├── schemas/              # Pydantic request/response schemas
│   ├── reel_schema.py
│   └── reel_insight_schema.py
├── integrations/         # Pluggable ingestion interface
│   ├── base_client.py        # Abstract base class
│   ├── seed_client.py        # CSV-backed implementation (active)
│   └── instagram_client.py   # Instagram Graph API stub (ready to activate)
├── ml/
│   ├── train_model.py    # Model training script
│   ├── predictor.py      # Prediction logic + recommendation engine
│   ├── features.py       # Feature engineering utilities
│   ├── model.pkl         # Trained RandomForest model
│   └── features.pkl      # Saved feature column names
├── core/
│   ├── config.py         # Environment config
│   └── database.py       # SQLAlchemy engine + session
└── main.py               # App entry point, router registration, CORS
```

---

## Database Schema

### `reels`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR (PK) | Instagram reel shortcode or generated ID |
| caption | TEXT | Reel caption or topic |
| hook_text | TEXT | Opening line or on-screen text |
| duration | INTEGER | Duration in seconds |
| category | VARCHAR | Content category / niche |
| audio_type | VARCHAR | Trending / Viral Track / Remix / Original |
| posted_at | DATETIME | Date posted |
| source | VARCHAR | `personal` or `synthetic` |
| created_at | DATETIME | Record created timestamp |

### `reel_insights`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER (PK) | Auto-increment |
| reel_id | VARCHAR (FK) | References reels.id |
| impressions | INTEGER | Total impressions |
| reach | INTEGER | Unique accounts reached |
| engagement | INTEGER | Likes + comments + saves + shares |
| saves | INTEGER | Save count |
| shares | INTEGER | Share count |
| video_views | INTEGER | Total video plays |
| snapshot_time | DATETIME | When metrics were captured |

---

## API Endpoints

### Reels
```
POST   /reels                      Create a reel
GET    /reels?source=personal      List reels (filter by source)
GET    /reels/{id}                 Get reel with insights
POST   /insights                   Add insight snapshot
GET    /reels/{id}/insights        Get all insight snapshots for a reel
```

### Analytics
```
GET    /analytics/summary?source=personal    Overall performance stats
GET    /analytics/categories                 Avg views/engagement by category
GET    /analytics/audio-types               Avg views/engagement by audio type
GET    /analytics/top-performing?limit=10   Top reels by view count
GET    /analytics/growth?source=personal    Chronological view count trend
GET    /analytics/top-performing-hooks      Hook/niche benchmarks from dataset
GET    /analytics/reel/{id}                 Per-reel engagement rates
```

### ML Prediction
```
POST   /predict/    Predict reel performance

Body:
{
  "duration_sec": 15,
  "hook_strength_score": 0.8,   // 0.0–1.0
  "niche": "Motivation",
  "music_type": "Trending",
  "is_weekend": 1
}

Response:
{
  "predicted_views": 312400,
  "performance_category": "High",
  "virality_probability": 0.78,
  "recommendation": "..."
}
```

### Ingestion
```
POST   /ingest/        Run full data ingestion
DELETE /ingest/clear   Truncate all reels and insights
```

---

## ML Model

**Algorithm:** RandomForestRegressor (scikit-learn)
**Target:** `views_total`
**Features:**
- `duration_sec` — reel length in seconds
- `hook_strength_score` — 0.0–1.0 signal strength of opening
- `niche` — content category (one-hot encoded)
- `music_type` — audio type (one-hot encoded)
- `is_weekend` — binary posting day signal

**Training data:** 400 viral short-form videos with real performance metrics
**Evaluation:** Mean Absolute Error on 20% holdout test set

To retrain:
```bash
cd backend
python ml/train_model.py
```

---

## Ingestion Architecture

The ingestion layer uses the **strategy pattern** — all data sources implement a common interface:

```python
class BaseIngestionClient(ABC):
    def fetch_reels(self) -> List[Dict]
    def fetch_insights(self, reel_id: str) -> Dict
```

**Current:** `SeedClient` — reads from `ig_content_log.csv` (personal Instagram data) and the viral shorts dataset. Personal reels are tagged `source=personal`.

**Ready:** `InstagramClient` — fully stubbed Graph API implementation. To activate:
1. Set `IG_ACCESS_TOKEN` and `IG_USER_ID` in `.env`
2. In `controllers/ingestion_controller.py`, replace `SeedClient()` with `InstagramClient()`

Nothing else changes.

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPIs, growth trend chart, top reels, category + audio breakdown |
| `/reels` | Reels Library — grid of personal reels with key metrics |
| `/scrapbook` | Freeform creative canvas — Excalidraw, localStorage persistence, exportable |
| `/planner` | Content calendar — CRUD for posts, brand deals, series, batch sessions |
| `/predict` | ML Predictor — form input → predicted views, virality score, recommendations |
| `/strategy` | Strategy — category intelligence, hook analysis, audio type performance |

---

## Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL running locally

### 1. Clone and configure

```bash
git clone <repo>
cd creator-dashboard
```

Create `.env` in the project root:
```
DATABASE_URL=postgresql://your_user@localhost:5432/creator_db
NEXT_PUBLIC_API_URL=http://localhost:8000
IG_ACCESS_TOKEN=
IG_USER_ID=
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Train the ML model (required before first run)
python ml/train_model.py

# Start the API server
uvicorn main:app --reload
```

### 3. Seed the database

```bash
curl -X POST http://localhost:8000/ingest/
```

This loads 9 personal reels (`source=personal`) and 400 synthetic records (`source=synthetic`). The personal reels power the dashboard and reels library. The full dataset trains the ML model and drives analytics patterns.

To reset and re-seed:
```bash
curl -X DELETE http://localhost:8000/ingest/clear
curl -X POST http://localhost:8000/ingest/
```

### 4. Frontend

```bash
# From project root
npm install
npm run dev
```

Open `http://localhost:3000`.

### 5. API documentation

FastAPI serves interactive docs automatically:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Design Decisions

**Why FastAPI?** Native async support, automatic OpenAPI docs, Pydantic validation — significantly faster to iterate on than Django REST for an API-first service.

**Why the strategy pattern for ingestion?** The Instagram Graph API requires Meta Developer account verification which was blocked during development. Designing the ingestion layer against an abstract interface means the data source is swappable — `SeedClient` is replaced by `InstagramClient` with one line change, no business logic touched.

**Why `source` tagging on reels?** Mixing personal data with synthetic training data in one table required a way to filter by origin. The dashboard shows real personal metrics to brands; analytics use the full dataset for statistically meaningful patterns.

**Why RandomForest over a neural network?** The training dataset is 400 rows — too small for deep learning. RandomForest handles tabular data well at this scale, generalizes without overfitting, and provides interpretable feature importances.

**Why not Alembic for migrations?** For a single-developer project at this stage, `ALTER TABLE` and `create_all()` are sufficient. Alembic would be introduced before multi-developer collaboration or production deployment.

---

## Roadmap

- Instagram Graph API integration (infrastructure already in place)
- Scheduled ingestion with APScheduler or Celery
- Prediction logging to database for model performance tracking over time
- SHAP values for per-prediction feature explainability
- Multi-user support with OAuth
