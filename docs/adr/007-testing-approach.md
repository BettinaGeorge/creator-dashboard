# ADR-007: Testing Approach — Integration-First with In-Memory SQLite

## Status
Accepted — 2026-03-06

## Context

This is a personal full-stack system that turns Instagram content into structured data — so I can see what's working, understand why, and create with intention instead of instinct. The backend handles ingestion, analytics computation, AI orchestration, and ML infrastructure across a layered architecture (Controller → Service → Repository).

The project needed a test suite that could:
- Run without a live Postgres connection (no environment setup, no credentials, no remote DB)
- Verify the full request-to-database flow — not just isolated functions
- Cover the domains that matter: reel CRUD, analytics, ingestion, and the prediction endpoint
- Complete fast enough to run before every commit

## Decision

We use **pytest** with **SQLite in-memory** as the test database. Tests are integration-first: they hit real FastAPI route handlers via `TestClient`, flow through the full stack, and write to a real (in-memory) database. No mocking of services, repositories, or ORM queries.

**Test isolation:** A shared `conftest.py` provides function-scoped fixtures. Each test gets a fresh database. `StaticPool` is used on the SQLAlchemy engine so all connections within a test share the same in-memory database (without this, SQLite creates a new empty DB per connection, causing "no such table" errors).

**What was tested:**

| File | Type | Tests |
|------|------|-------|
| `test_reels.py` | Integration | 5 — list empty, create + get, 404 on missing, list all, reel with insights |
| `test_analytics.py` | Integration | 5 — summary empty, summary with data, categories, top performing, audio types |
| `test_ingestion.py` | Integration + Unit | 6 — ingest creates reels, idempotency, insights created, skips bad rows, clear removes all, export client loads |
| `test_prediction.py` | Integration + Unit | 4 — endpoint loads (200 or 503), expected fields, empty payload returns 422, direct predictor call |

Total: **20 tests, all passing.**

**The prediction tests** are included because the endpoint exists in the codebase and the controller has real validation logic (missing required fields → 422). However, performance prediction is not an active product feature — the ML model is trained on synthetic data and is not wired to production. See ADR-004. The tests confirm the endpoint behaves correctly at the HTTP layer; they do not validate prediction accuracy.

## Alternatives Considered

**Unit tests only (mocking services and repositories)** — faster and more isolated, but would not catch wiring bugs between layers. The layered architecture (ADR-001) is precisely what benefits from integration testing: a mocked service test would pass even if the controller forgot to call the service at all.

**E2E tests (Playwright/Cypress)** — would require a browser, a deployed frontend, and a live backend. Too much infrastructure overhead for a solo personal project. Not proportionate to the current stage.

**Test against Postgres** — the correct long-term approach for catching Postgres-specific behaviour (e.g. the `ALTER TABLE ADD COLUMN IF NOT EXISTS` guard in `main.py` only runs on Postgres). Not practical as the default test path: requires a running Postgres instance and credentials. The Postgres-specific startup migration is documented and manually verified on Render.

**pytest-mock / monkeypatching** — could mock the `InstagramExportClient` in ingestion tests. Rejected in favour of testing against the real client with its actual `reels.json` fixture, which is committed to the repo. This means `test_export_client_loads_reels` tests the real parsing logic, not a stub.

## Consequences

**Positive**
- Tests run anywhere with `uv run pytest` — no database setup, no credentials, no network
- Integration tests catch real bugs: the `reel_controller.py` 404 regression (returning `None` instead of raising `HTTPException`) was caught by `test_get_reel_not_found`, and the prediction crash on empty input was caught by `test_predict_empty_payload`
- The test DB uses the same ORM models and schema as production — schema drift is caught automatically
- Fast: 20 tests complete in under 1 second

**Negative**
- SQLite and Postgres have different SQL dialects — Postgres-specific behaviour (JSON operators, `ILIKE`, window functions) would not be caught
- No frontend test coverage — UI regressions require manual testing
- No load or performance testing — not relevant at personal-project scale
