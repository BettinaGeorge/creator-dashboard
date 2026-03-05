# ADR-003: reel_tags Table Without a Foreign Key to reels

## Status
Accepted — 2026-03-03

## Context

Reels can be manually tagged with a content niche (Fitness, Beauty, Lifestyle, etc.) and a Storytelling format flag. This tagging is user work — it takes time, reflects creative judgment, and directly feeds the analytics layer.

During development, the database is frequently reset via `DELETE /ingest/clear` to reload fresh seed data. A standard foreign key from `reel_tags.reel_id` to `reels.id` would cascade-delete all tags on every reset, wiping the manual work.

## Decision

The `reel_tags` table has **no foreign key constraint** to the `reels` table.

To compensate, `ingestion_service` re-applies all existing tags to freshly inserted reels after every ingest run — keeping `reel.category` consistent for analytics queries without relying on the database to enforce the relationship.

## Alternatives Considered

**Standard FK with ON DELETE CASCADE** — tags are deleted when reels are deleted. Simplest to implement, but loses all manual work on every data reset. Unacceptable during active development.

**FK with ON DELETE SET NULL** — tags are preserved as orphaned rows with a null reel_id. Preserves the data but makes re-application logic more complex.

**Separate "tag backup" table** — copy tags before clear, restore after reingest. Works but adds a two-step process and a redundant table.

**Don't support data resets** — avoid the problem entirely by never truncating the database. Not viable during active development against seed data.

## Consequences

**Positive**
- Manual tags survive any number of data resets — user work is never lost
- Tag data is decoupled from the ingestion lifecycle, which is the right separation

**Negative**
- Referential integrity is enforced in application code (`ingestion_service`), not the database — a bug in the re-application logic could leave tags un-applied without any DB-level error
- A reel_tag row can exist for a reel_id that has no corresponding row in `reels` — orphaned tags accumulate if reels are deleted without a subsequent reingest
