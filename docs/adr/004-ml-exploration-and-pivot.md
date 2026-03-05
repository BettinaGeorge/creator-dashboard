# ADR-004: ML Exploration, Data Constraints, and Pivot to AI-Driven Workflow

## Status
Accepted — 2026-03-05

## Context

The original goal of this platform was performance prediction: given a reel's features before posting, predict whether it would be a top performer — ideally returning estimated view counts and a viral probability score.

The vision extended further than structured feature input. The ideal system would accept a video upload, extract features automatically (duration via transcription, hook strength from the opening line, visual quality from frame analysis, pacing from motion detection), and return a prediction without the creator filling in any form. This is a legitimate ML problem at the intersection of computer vision, NLP, and regression.

**What was built:**
- Feature engineering pipeline (`features.py`) — ordinal encoding for categoricals, scaling for numerics
- Training script (`train_model.py`) — trains on the viral shorts dataset, serializes artifacts with `joblib`
- Prediction wrapper (`predictor.py`) — `predict_reel(data)` applies the encoding pipeline and returns predicted views + binary viral probability
- `/predict` HTTP endpoint — wired and functional
- Chosen model: **RandomForestRegressor**

**Why RandomForest over a neural network:** At 400 training rows, a deep model would overfit immediately — far more parameters than data points. RandomForest handles small tabular datasets well through ensemble averaging, reduces variance without explicit regularization, and produces feature importances for interpretability.

**Features selected:**

| Feature | Rationale |
|---------|-----------|
| `duration_sec` | Watch completion rate is a top Instagram ranking signal |
| `hook_strength_score` | Opening line quality drives first-second retention |
| `niche` | Performance distributions vary significantly by content category |
| `music_type` | Trending audio is promoted by Instagram's discovery layer |
| `is_weekend` | Posting day affects organic reach via audience activity windows |

## Decision

We preserve the ML infrastructure but **do not activate it in production**. We pivot the product direction from "predict the outcome before posting" to "understand what's working and improve the content going in."

The active platform instead delivers: analytics dashboards, niche performance insights, hook pattern analysis, posting cadence tracking, and an AI Studio for content creation — all of which answer the more actionable question for a solo creator.

## Why the ML path is blocked

1. **Instagram Graph API verification blocked.** Per-reel metrics require the Graph API. Meta Business verification was not cleared during development.
2. **The data export has no per-reel performance data.** Instagram's downloadable export provides real reel metadata but only account-level totals — no individual reel views, watch time, or engagement breakdown.
3. **Duration is null for all personal reels.** The strongest planned feature is unavailable without the API.
4. **Dataset size.** Even fully instrumented, 80 reels is far below the threshold for a generalizable regression model. The interaction effects between features require thousands of examples.
5. **Training data is synthetic.** The supplemental 400-row dataset reflects "average viral creator" patterns — not this creator's niche, audience, or context. A model trained on it does not generalize to real predictions.
6. **The target is inherently stochastic.** Reel performance is partly algorithmic. The same content posted twice gets different results. This sets a hard floor on prediction accuracy regardless of training data quality.

## Alternatives Considered

**Ship the predictor on synthetic data** — technically possible, but would produce misleading confidence scores. A model trained on generic viral patterns would not reflect this creator's actual performance dynamics. Worse than nothing.

**Wait for the Graph API** — the right long-term path, but blocked the entire platform build while verification was pending. Not viable.

**Abandon ML entirely** — would mean losing the infrastructure investment and the learning from building it. The pivot keeps the code active and architecturally wired for reactivation.

## Consequences

**Positive**
- The pivot produces a more immediately useful product — analytics and AI tools answer actionable questions a view count prediction cannot
- The ML infrastructure is preserved; reactivation requires data, not re-engineering
- Data exploration done while building the ML pipeline directly shaped which analytics panels and insights were meaningful to build

**Negative**
- The technically ambitious ML demo is not available at launch
- Reactivation depends on external access (Graph API verification) that is outside the project's control
- Automatic video feature extraction (transcription, visual quality, pacing) — the most compelling version of the predictor — remains future work even after Graph API access is established
