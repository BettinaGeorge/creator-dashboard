# ADR-005: AI Model Selection for the Content Studio

## Status
Accepted — 2026-03-05

## Context

The AI Studio requires an LLM to power five content creation tools: hook writing, content briefs, strategy reads, series planning, and trend scouting. Each tool must produce output in a specific creator's voice — not generic advice. The model needs strong instruction-following, creative writing quality, and a context window large enough to support injecting live analytics data into prompts.

## Decision

We use **claude-sonnet-4-6** as the default model across all five tools.

Output token limits are set per tool based on expected response density, not a single global cap:

| Tool | Max tokens | Rationale |
|------|-----------|-----------|
| Hook Lab | 1500 | 5 hooks × hook + rationale + rating |
| Content Brief | 1200 | 6 structured sections |
| Strategy Advisor | 1500 | Analytical depth requires headroom |
| Series Planner | 2000 | 5 episodes × 4 fields each |
| Trend Scout | 1200 | 4 sections with examples |

## Alternatives Considered

| Model | Verdict |
|-------|---------|
| **claude-haiku-4-5** | 5× cheaper; noticeable quality drop on nuanced strategy and voice-matched creative output. Viable for simpler structured tasks. |
| **claude-opus-4-6** | Meaningfully better reasoning; 5× more expensive than Sonnet. Warranted for high-stakes analytical tools, overkill for all five. |
| **GPT-4o** | Comparable quality to Sonnet; slightly cheaper; 128k context window limits data injection headroom compared to Sonnet's 200k. |
| **GPT-4o-mini** | Very cheap; real degradation on creative specificity and voice fidelity at this task complexity. |
| **Gemini 1.5 Flash** | Cheapest viable option; 1M context window is a significant advantage; weaker on tone consistency and creator-specific nuance. |

Sonnet was selected because the tools require writing *in a specific creator's voice* across different formats and registers — this is where Sonnet's instruction-following and creative depth are most differentiated from cheaper alternatives. At the current usage scale (one creator, ~20 calls/day), cost difference between tiers is negligible.

## Planned: Per-Tool Model Tiering

Not all tools have equal stakes. The planned next step is tiering by task complexity:

| Tool | Current | Planned | Reason |
|------|---------|---------|--------|
| Hook Lab | Sonnet | Haiku | Repetitive structured task; speed matters; quality difference is small |
| Trend Scout | Sonnet | Haiku | Factual retrieval pattern; less voice-sensitive |
| Content Brief | Sonnet | Sonnet | Needs creative depth and structural fidelity |
| Series Planner | Sonnet | Sonnet | Multi-episode narrative arc; voice-critical |
| Strategy Advisor | Sonnet | Opus | Reads real analytics data and makes strategic recommendations — highest stakes |

## Context Injection — Implemented

All five tools receive three layers of context at call time:

1. **`CREATOR_CONTEXT`** — static: 7 content pillars, audience profile, voice (defined in `ai_service.py`)
2. **`build_data_context(db)`** — dynamic: live analytics queried on each call (niche performance by avg views, top reel hooks, audio type breakdown)
3. **Planner context** — dynamic: upcoming scheduled content, active brand deals, and active series serialised from the creator's localStorage planner and passed in the request body from the frontend (`getPlannerContext()` in `lib/api.ts`)

The controller combines layers 2 and 3 in `_build_ctx()` before passing to the service. Layer 1 is embedded in each service function's prompt string. This means every tool — including Hook Lab and Trend Scout — is aware of what's already planned and which brand deals are live.

## Consequences

**Positive**
- Sonnet's 200k context window provides ample headroom for all three context layers without hitting limits
- Swapping models requires changing one field per function in `ai_service.py` — the architecture isolates this decision
- Model tiering can be introduced incrementally without structural changes

**Negative**
- All five tools currently use Sonnet regardless of task complexity — some calls are over-specified (Hook Lab does not need Sonnet-level quality)
- Cost scales linearly with usage; tiering should be implemented before volume increases significantly
