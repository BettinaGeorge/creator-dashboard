# ADR-006: Dual-View Architecture — Personal Dashboard and Brand Portal

## Status
Proposed — 2026-03-05

## Context

The current platform is the creator's internal operations layer — analytics, AI tools, content planning, and creative workspace. It is designed for one user and contains sensitive operational data that should never be exposed to external parties.

Brand partnerships are a core part of a creator's business. Currently there is no structured way to present the creator's work, metrics, or availability to a potential brand partner. That process happens through manually maintained media kits, email threads, and ad hoc PDF decks — none of which stay current or reflect the live data the platform already holds.

The gap: the platform has the data, but no way to present it professionally to an external audience.

## Decision

We extend the platform with a second view — a **brand portal** — that presents the same underlying data through a different lens, for a different audience, with different access controls.

**Personal view (current):** Full analytics, AI Studio, Scrapbook, Content Insights, Planner. Protected by passcode/JWT. Never exposed externally.

**Brand view (new):** A professional portal for brand partnership teams. Read-only. Surfaces only what is relevant to a brand:
- **Portfolio** — top-performing reels curated by niche
- **Metrics** — reach, avg views, niche authority, audience breakdown in brand-readable language
- **Calendar** — live content schedule showing availability and active campaigns
- **Proposals** — brands submit a campaign concept; creator reviews privately before responding
- **Contact** — direct line with context pre-established

**AI's role in the brand view:**
- `generate_media_kit()` — Claude reads live analytics and writes the pitch narrative; stays current automatically
- `score_proposal()` — when a brand submits a brief, Claude evaluates alignment with content pillars and returns a private compatibility analysis to the creator
- `generate_campaign_brief()` — once a deal is accepted, Claude generates a production brief tailored to that brand within the creator's voice

## Alternatives Considered

**Manually maintained media kit (PDF/Notion)** — current state. Does not stay current, requires manual updates, disconnected from live data.

**Public analytics page** — expose all analytics publicly. Shares too much operational data; not appropriate for brand-facing context.

**Third-party creator marketplace (e.g. AspireIQ, Grin)** — hands off the brand relationship entirely. Loses the direct relationship, takes a cut, removes control over how the creator is presented.

## Consequences

**Positive**
- Brand partners see a live, always-current view of the creator's metrics and availability — no stale PDFs
- The creator retains full control over what is shared and with whom
- The AI layer extends naturally into business tooling (proposal scoring, campaign brief generation) — not just creative tooling
- This is the natural path to SaaS: the personal view becomes the subscription product; the brand portal becomes the distribution channel that makes it valuable

**Negative**
- Requires role-based access control, new DB tables (`proposals`, `brand_profiles`), a new route group (`/brand/*`), and new AI service functions — significant scope increase
- Shareable brand links require token management to ensure one brand cannot see another's interactions
- Referential integrity between `proposals` and user/brand identity requires an auth layer that does not yet exist

## Open Questions

- Auth strategy for personal view: simple PIN/passcode vs. full JWT vs. NextAuth
- Whether brand view is public-by-default (anyone with the link) or requires the brand to be registered
- How proposal status and creator responses flow back to the brand
