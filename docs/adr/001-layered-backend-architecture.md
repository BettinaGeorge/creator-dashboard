# ADR-001: Layered Backend Architecture (Controller → Service → Repository)

## Status
Accepted — 2026-03-03

## Context

The backend needed to handle HTTP routing, business logic, analytics computation, ML orchestration, AI generation, and database access — across multiple feature domains (reels, analytics, tagging, ingestion, prediction). Without clear boundaries, logic would accumulate in route handlers, making the codebase hard to test, extend, and reason about.

## Decision

We implement a strict three-layer backend architecture:

- **Controller** — HTTP routing and request validation only. No logic, no SQL.
- **Service** — all business logic, analytics computation, ML/AI orchestration.
- **Repository** — all database queries via SQLAlchemy. No business logic, no HTTP handling.

Each layer depends only on the layer directly below it. No layer skips a level.

## Alternatives Considered

**Flat route handlers** — all logic in the controller. Simpler upfront, becomes unnavigable as the codebase grows. Hard to test without an HTTP client.

**Service-only (no repository layer)** — services talk directly to the ORM. Works for small projects but mixes query logic with business logic; queries become hard to reuse or swap.

## Consequences

**Positive**
- Each layer is independently testable — services can be unit tested without HTTP context; repositories can be tested without business logic
- Responsibility boundaries are clear and enforceable — new features follow the same pattern
- Swapping the database layer (e.g. to async SQLAlchemy) only touches repositories

**Negative**
- More files than a flat approach — each feature domain has a controller, service, and repository
- Requires discipline to maintain layer boundaries as the codebase grows
