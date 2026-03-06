# Creator Content Intelligence Platform

A personal full-stack system I built to turn my own Instagram content into structured data — so I can see what's working, understand why, and create with intention instead of instinct.

I'm a content creator documenting my life as a Nigerian college student in the US — fitness, beauty, faith, fashion, travel, the whole honest journey. Instagram gives you a feed, not a feedback loop. This is my feedback loop. It ingests my real reel data from Instagram's export, stores it in PostgreSQL, surfaces performance patterns across my content niches and posting history, and uses Claude AI to power a full content creation workflow — hook writing, briefs, series planning, strategy reads, and trend scouting.

> **Status:** Fully functional — backend complete, frontend wired to live data, AI Studio active.
>
> **Live Demo:** [creator-dashboard-indol.vercel.app](https://creator-dashboard-indol.vercel.app/)

---

## What It Does

1. **Ingests** real reel data from Instagram's data export (80 actual reels) via a pluggable ingestion layer — architecture is ready to switch to live Graph API metrics in one line
2. **Stores** structured reel metadata and multi-field engagement metrics in PostgreSQL
3. **Analyzes** performance across niches, growth over time, posting cadence, and hook patterns
4. **Tags** reels with manual niche labels (Fitness, Beauty, Lifestyle, Fashion, Faith, Travel) + Storytelling format flag — tags survive database reingests via a no-FK design
5. **Creates** with an AI Studio powered by Claude: hook writing, content briefs, strategy reads, series planning, trend scouting
6. **Displays** everything in a creator-facing dashboard with collapsible sidebar, dark/light theme, and responsive layout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, custom CSS |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy ORM |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| Data | 80 real Instagram reels (from account export) + viral shorts dataset (400 rows) |

---

## Architecture

```
          CREATOR CONTENT INTELLIGENCE  ·  System Architecture


+------------------------------------------------------------------------------+
|                         USER INTERFACE LAYER                                 |
|                     Next.js 15  ·  TypeScript  ·  Vercel                    |
|                                                                              |
|  +-----------+  +-----------+  +-----------+  +--------+  +----------+      |
|  | Dashboard |  |  Reels    |  | Insights  |  | Studio |  | Scrapbook|      |
|  | /         |  | /reels    |  | /insights |  | /studio|  | /scrap.. |      |
|  |           |  | /reels/id |  |           |  |        |  |          |      |
|  +-----------+  +-----------+  +-----------+  +--------+  +----------+      |
|                                                                              |
|  +-----------+  +-----------+                                                |
|  | Planner   |  | Predictor |                                                |
|  | /planner  |  | /predict  |                                                |
|  |           |  | (paused)  |                                                |
|  +-----------+  +-----------+                                                |
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
|  +------------------+  +------------------+  +------------------+           |
|  |  /analytics/*    |  |   /reels/*       |  |   /insights      |           |
|  | summary · growth |  | GET list         |  | POST create      |           |
|  | categories · top |  | GET /{id}        |  | GET /{id}/insights|          |
|  | hooks · audio    |  | POST create      |  +------------------+           |
|  +------------------+  +------------------+                                 |
|                                                                              |
|  +------------------+  +------------------+  +------------------+           |
|  |  /reels/{id}/    |  |   /reel-tags     |  |   /ai/*          |           |
|  |  tags GET · PUT  |  |  batch tag map   |  | hooks · brief    |           |
|  +------------------+  +------------------+  | strategy · series|           |
|                                              | trends           |           |
|  +------------------+  +------------------+  +------------------+           |
|  |   /predict/      |  |   /ingest/       |                                 |
|  |   POST (paused)  |  | POST / DELETE    |                                 |
|  +------------------+  +------------------+                                 |
|                                       |                                      |
|                                       ▼                                      |
|                                  SERVICES                                    |
|  +--------------+  +--------------+  +----------------+  +--------------+   |
|  | analytics_svc|  | reel_svc     |  | reel_insight   |  | ai_svc       |   |
|  | summary      |  | CRUD · fetch |  | _svc           |  | Claude API   |   |
|  | growth       |  |              |  | create · get   |  | 5 tools      |   |
|  | categories   |  +--------------+  +----------------+  +--------------+   |
|  +--------------+                                                            |
|                                                                              |
|  +--------------+  +--------------+                                          |
|  | ingestion_svc|  | prediction   |                                          |
|  | upsert       |  | _svc         |                                          |
|  | re-tag       |  | RandomForest |                                          |
|  +--------------+  +--------------+                                          |
|                                       |                                      |
|                                       ▼                                      |
|                               REPOSITORIES                                   |
|  +--------------------+  +------------------------+  +------------------+   |
|  |  reel_repository   |  | reel_insight_repository|  | reel_tag_repo    |   |
|  |  CRUD · filter     |  | create · get by reel   |  | upsert · get_all |   |
|  +--------------------+  +------------------------+  +------------------+   |
+------------------------------------------------------------------------------+
          |                          |                        |
   SQLAlchemy ORM             Anthropic SDK            scikit-learn
          |                          |                        |
          ▼                          ▼                        ▼
+-------------------+    +----------------------+    +-------------------+
|    PostgreSQL     |    | Claude sonnet-4-6    |    | RandomForest      |
|    Neon (cloud)   |    | Anthropic API        |    | model.pkl         |
|                   |    |                      |    | features.pkl      |
|  reels            |    | Tools:               |    |                   |
|  ├── id (PK)      |    | · generate_hooks()   |    | Features:         |
|  ├── hook_text    |    | · generate_brief()   |    | duration_sec      |
|  ├── category     |    | · generate_strategy()|    | hook_strength     |
|  ├── duration     |    | · generate_series()  |    | niche             |
|  └── source       |    | · generate_trends()  |    | music_type        |
|                   |    |                      |    | is_weekend        |
|  reel_insights    |    | Context: creator     |    |                   |
|  ├── engagement   |    | pillars + live       |    | Target:           |
|  ├── saves        |    | analytics injected   |    | views_total       |
|  └── video_views  |    | at call time         |    |                   |
|                   |    +----------------------+    | (paused — needs   |
|  reel_tags (no FK)|                               | real Graph API    |
|  ├── reel_id (PK) |                               | data to train on) |
|  ├── category     |                               +-------------------+
|  ├── storytelling |
|  └── updated_at   |
+-------------------+


+------------------------------------------------------------------------------+
|                    INGESTION LAYER  ·  Strategy Pattern                      |
|                                                                              |
|  +-------------------------------------+  +--------------------------------+ |
|  |  InstagramExportClient  ✓  (active) |  | InstagramClient  ⚡  (ready)   | |
|  |                                     |  |                                | |
|  |  reels.json                         |  | Instagram Graph API            | |
|  |  80 real reels from IG export       |  | awaiting IG_ACCESS_TOKEN       | |
|  |  real captions, timestamps, videos  |  | swap 1 line to activate        | |
|  |  metrics estimated from account     |  |                                | |
|  |  aggregates (Graph API for actuals) |  | instagram_client.py  built     | |
|  |                                     |  |                                | |
|  |  + viral_shorts_dataset.csv         |  |                                | |
|  |  400 rows  ·  analytics coverage    |  |                                | |
|  +-------------------------------------+  +--------------------------------+ |
|                                                                              |
|  After ingestion: manual tags from reel_tags are re-applied automatically   |
+------------------------------------------------------------------------------+
```

---

## Backend Structure

```
backend/
├── controllers/          # Route definitions, request/response handling
│   ├── reel_controller.py
│   ├── reel_insight_controller.py
│   ├── reel_tag_controller.py    # GET/PUT /reels/{id}/tags, GET /reel-tags
│   ├── analytics_controller.py
│   ├── ai_controller.py          # POST /ai/hooks|brief|strategy|series|trends
│   └── ingestion_controller.py
├── services/             # Business logic, analytics computation, AI calls
│   ├── reel_service.py
│   ├── reel_insight_service.py
│   ├── analytics_service.py
│   ├── ai_service.py             # Claude API integration — all 5 studio tools
│   └── ingestion_service.py      # Re-applies manual tags after each ingest
├── repositories/         # SQLAlchemy CRUD, all DB queries live here
│   ├── reel_repository.py
│   ├── reel_insight_repository.py
│   └── reel_tag_repository.py    # upsert/get/get_all for reel_tags table
├── models/               # SQLAlchemy ORM models
│   ├── reel.py
│   ├── reel_insight.py
│   └── reel_tag.py               # No FK to reels — survives ingest/clear
├── schemas/              # Pydantic request/response schemas
│   ├── reel_schema.py
│   ├── reel_insight_schema.py
│   └── reel_tag_schema.py
├── integrations/         # Pluggable ingestion interface
│   ├── base_client.py
│   ├── instagram_export_client.py   # Active — reads from local IG data export
│   └── instagram_client.py          # Stubbed — Graph API, ready to activate
├── core/
│   ├── config.py         # Includes ANTHROPIC_API_KEY
│   └── database.py
└── main.py
```

---

## Database Schema

### `reels`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR (PK) | Instagram media ID extracted from export |
| caption | TEXT | Reel caption |
| hook_text | TEXT | First line of caption, stripped of @mentions and hashtags |
| duration | INTEGER | Seconds — null for export-sourced reels (requires Graph API) |
| category | VARCHAR | Content niche — set by tag writes or caption inference |
| audio_type | VARCHAR | |
| posted_at | DATETIME | |
| source | VARCHAR | `personal` or `synthetic` |
| created_at | DATETIME | |

### `reel_insights`
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER (PK) | Auto-increment |
| reel_id | VARCHAR (FK) | References reels.id |
| impressions | INTEGER | |
| reach | INTEGER | Unique accounts reached |
| engagement | INTEGER | Likes + comments + saves + shares |
| saves | INTEGER | |
| shares | INTEGER | |
| video_views | INTEGER | |
| snapshot_time | DATETIME | |

### `reel_tags`
| Column | Type | Notes |
|--------|------|-------|
| reel_id | VARCHAR (PK) | **No FK** — survives `DELETE /ingest/clear` |
| category | VARCHAR | Fitness / Beauty / Lifestyle / Fashion / Faith / Travel |
| storytelling | BOOLEAN | Additive format tag — combinable with any niche |
| updated_at | DATETIME | |

---

## API Endpoints

### Reels
```
POST   /reels                        Create a reel
GET    /reels?source=personal        List reels (filter by source)
GET    /reels/{id}                   Get reel with insights
POST   /insights                     Add insight snapshot
GET    /reels/{id}/insights          Get all insight snapshots for a reel
GET    /reels/{id}/tags              Get manual tags for a reel
PUT    /reels/{id}/tags              Set manual tags (category + storytelling)
GET    /reel-tags                    Batch: all tags as {reel_id: {category, storytelling}}
```

### Analytics
```
GET    /analytics/summary?source=personal    Overall KPIs
GET    /analytics/categories?source=personal Avg views/saves/engagement by niche
GET    /analytics/audio-types               Avg views/engagement by audio type
GET    /analytics/top-performing?limit=5    Top reels by view count
GET    /analytics/growth?source=personal    Chronological view trend
GET    /analytics/top-performing-hooks      Hook/niche benchmarks from dataset
```

### AI Studio
```
POST   /ai/hooks       Generate 5 hook variations      { niche, angle }
POST   /ai/brief       Generate full reel brief         { niche, idea }
POST   /ai/strategy    Strategy read from live data     (no body — pulls analytics)
POST   /ai/series      Storytelling series plan         { concept, episode_count }
POST   /ai/trends      Trending formats in niche        { niche }
```

### Ingestion
```
POST   /ingest/        Run full ingestion (re-applies manual tags after)
DELETE /ingest/clear   Truncate reels + insights (reel_tags preserved)
```

---

## AI Studio

Five tools powered by claude-sonnet-4-6, each aware of the creator's content pillars and voice:

| Tool | What it does |
|------|-------------|
| **Hook Lab** | 5 hook variations for any niche + angle, with psychological explanation |
| **Content Brief** | Full reel brief: hook, build, payoff, CTA, caption starter, hashtags |
| **Strategy Advisor** | Pulls live analytics and gives a sharp strategy read — what's working, what isn't, one action this week. Includes Best Posting Day chart. |
| **Series Planner** | Multi-episode storytelling arc with hooks and cliffhangers |
| **Trend Scout** | Trending formats, hook styles, and one underused angle for the niche |

Every tool receives three layers of context at call time:
- **`CREATOR_CONTEXT`** — 7 content pillars, audience profile, and voice (static, in `ai_service.py`)
- **`build_data_context(db)`** — live analytics: niche performance ranked by avg views, top performing reel hooks, audio type breakdown (queried fresh on each call)
- **Planner context** — upcoming scheduled content, active brand deals, and active series serialised from the creator's localStorage planner and passed from the frontend

This means the Hook Lab already knows what's scheduled this week, the Content Brief knows which brand deals are live, and the Strategy Advisor has the full picture.

---

## Content Tagging System

Reels can be manually tagged with:
- **Primary niche** (single-select): Fitness, Beauty, Lifestyle, Fashion, Faith, Travel
- **Storytelling** (additive toggle): combinable with any niche

**Design decision:** `reel_tags` has no foreign key to `reels`. This means tags survive `DELETE /ingest/clear` — re-seeding the database doesn't wipe manual work. After every ingest run, `ingestion_service` re-applies existing tags to freshly inserted reels.

Tags feed directly into analytics — the Content Pillars panel on the Insights page uses these labels.

---

## Testing

The backend has a pytest test suite that runs entirely in-memory — no Postgres connection, no external services required.

```bash
cd backend
uv run pytest tests/ -v
```

**20 tests · all passing**

| File | Approach | What it covers |
|------|----------|---------------|
| `test_reels.py` | Integration | CRUD endpoints, 404 handling, reel + insight relationships |
| `test_analytics.py` | Integration | Summary stats, category breakdown, audio types, top performing |
| `test_ingestion.py` | Integration + Unit | Ingest run, idempotency, clear endpoint, export client loading |
| `test_prediction.py` | Integration + Unit | Input validation (422 on missing fields), field presence, direct predictor call |

**Approach — integration-first, not E2E**

Tests hit real FastAPI route handlers via `TestClient`, flow through the full stack (controller → service → repository), and write to a real SQLite database. This verifies that the layers wire together correctly — not just that individual functions return the right values in isolation.

The one unit test (`test_predictor_directly`) calls `predict_reel()` directly, bypassing HTTP entirely, to confirm the ML module is importable and returns the expected shape.

No E2E tests — those would require a browser and the deployed frontend/backend. Not the right tool for a solo personal project at this stage.

**Test isolation** is handled by a shared `conftest.py`: each test function gets a fresh SQLite database via function-scoped fixtures and `StaticPool` (ensures all connections share the same in-memory DB within a test). No test state leaks between runs.

The prediction tests are included for completeness — the `/predict` endpoint exists in the codebase — but prediction is not an active feature. See [ADR-004](docs/adr/004-ml-exploration-and-pivot.md) and [ADR-007](docs/adr/007-testing-approach.md).

---

## ML Infrastructure

Performance prediction was the original north star: a pre-posting predictor estimating view counts and viral probability from reel structure. A full pipeline was built — feature engineering, RandomForestRegressor, `/predict` endpoint — but it is inactive in production.

Six data constraints blocked activation, most critically the Instagram Graph API verification required for real per-reel metrics. The platform pivoted to AI-driven workflow tools that answer more actionable questions with available data. The infrastructure is preserved for reactivation once Graph API access is established.

Full decision record and obstacle analysis: [ADR-004 — ML Exploration and Pivot](docs/adr/004-ml-exploration-and-pivot.md)

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPIs, growth trend (full card height), top reels, niche performance (2-col breakdown) |
| `/reels` | Reels Library — filter by niche/duration/timeframe/storytelling, sort 9 ways, live count, keyboard-accessible |
| `/reels/[id]` | Reel detail — 3-column layout, video + content/tags + metrics, prev/next navigation (← → keys), manual tagging |
| `/insights` | Content Insights — avg views by niche, hook length patterns, posting cadence, top performing hooks |
| `/studio` | AI Studio — 5 Claude-powered content tools; each call receives live analytics + planner context |
| `/scrapbook` | Freeform creative canvas — Excalidraw, localStorage persistence, exportable |
| `/planner` | Content calendar — CRUD for posts, brand deals, series, batch sessions |

---

## Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL running locally
- Anthropic API key (for AI Studio)

### 1. Clone and configure

```bash
git clone <repo>
cd creator-dashboard
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://localhost/creator_db
ANTHROPIC_API_KEY=sk-ant-...
IG_ACCESS_TOKEN=
IG_USER_ID=
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt   # or: pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

### 3. Seed the database

```bash
curl -X POST http://localhost:8000/ingest/
```

Loads 80 personal reels from the Instagram data export (`source=personal`) and 400 synthetic records (`source=synthetic`). To reset:
```bash
curl -X DELETE http://localhost:8000/ingest/clear
curl -X POST http://localhost:8000/ingest/
```

Note: manual reel tags are preserved through clear/reingest cycles.

### 4. Frontend

```bash
# From project root
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Design Decisions

Full rationale in the [Architecture Decision Records](docs/adr/).

- **Layered backend (Controller → Service → Repository)** — each layer is independently testable; business logic never lives in route handlers. → [ADR-001](docs/adr/001-layered-backend-architecture.md)
- **Strategy pattern for ingestion** — `InstagramExportClient` swaps to `InstagramClient` with one line change; no business logic touched. → [ADR-002](docs/adr/002-ingestion-strategy-pattern.md)
- **No FK on `reel_tags`** — manual tags survive `DELETE /ingest/clear`; ingestion service re-applies them after each run. → [ADR-003](docs/adr/003-reel-tags-no-foreign-key.md)
- **ML infrastructure preserved but inactive** — Graph API verification blocked production use; platform pivoted to AI-driven workflow. → [ADR-004](docs/adr/004-ml-exploration-and-pivot.md)
- **claude-sonnet-4-6 as default model** — evaluated against GPT-4o, Haiku, and Gemini Flash; Sonnet wins on voice fidelity for creator-specific output. Planned tiering: Haiku for Hook Lab/Trend Scout, Opus for Strategy Advisor. → [ADR-005](docs/adr/005-ai-model-selection.md)
- **Single-select niche** — keeps `avg_views by category` queries clean without joins; secondary niche field (additive) is a planned near-term addition.
- **Metrics estimated from aggregate export data** — Instagram export has no per-reel breakdown; views distributed across reels using exponential weighting to approximate the natural reach curve. Per-reel accuracy requires the Graph API.
- **Integration-first testing with in-memory SQLite** — tests hit real FastAPI route handlers through the full stack with no Postgres dependency; SQLite + StaticPool gives clean isolation per test function. → [ADR-007](docs/adr/007-testing-approach.md)

---

## Roadmap

### Near-term
- **Secondary niche field** — multi-select for cross-pillar reels (Fitness + Lifestyle, Travel + Fashion), additive metadata that doesn't disrupt analytics
- **Instagram Graph API** — infrastructure in place, swap one line once token available; unlocks real per-reel metrics, watch time, and eventually ML predictor

### Medium-term
- Scheduled ingestion (APScheduler or Celery) for automated metric refresh
- Alembic migrations before multi-developer collaboration
- ML predictor reactivation once real per-reel data is available from Graph API

### Long-term
- **Dual-view architecture** — brand-facing portal surfacing portfolio, metrics, content calendar, and a proposal inbox alongside the personal dashboard. AI generates the media kit narrative from live data and scores inbound brand proposals against the creator's content pillars. → [ADR-006](docs/adr/006-dual-view-personal-and-brand-portal.md)
