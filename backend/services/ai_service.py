"""
AI Studio service — calls Claude to power content workflow features.
Requires ANTHROPIC_API_KEY in .env
"""
import anthropic
from core.config import settings

CREATOR_CONTEXT = """You are an AI content strategist for Bettina George, a Nigerian international
student and content creator. Her content pillars are:
- Fitness (workouts, wellness, motivation)
- Beauty (skincare, makeup)
- Lifestyle (Nigerian identity, college life, travel, career, internships — the "get to know me" pillar)
- Fashion (outfits, style, OOTD)
- Faith (faith journey, spirituality, devotional content)
- Travel (travel vlogs, destinations, experiences as a Nigerian international student)
- Storytelling (series, vlogs, creative narrative content — a new pillar she's actively building)

Her audience connects with her authentic personality, her Nigerian background, and her life as a
college student navigating beauty, fitness, and ambition. Keep recommendations specific,
actionable, and true to her voice — not generic influencer advice."""


def _client() -> anthropic.Anthropic:
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set in .env")
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def generate_hooks(niche: str, angle: str) -> dict:
    """Generate 5 hook variations for a given niche and content angle."""
    prompt = f"""{CREATOR_CONTEXT}

Generate 5 compelling hook variations for a reel in the **{niche}** niche.
Content angle: "{angle}"

For each hook:
1. Write the hook (under 12 words, first line of the reel)
2. One sentence on why it works psychologically (curiosity gap, relatability, shock, etc.)
3. Rate its strength: Strong / Medium / Experimental

Format as a clean numbered list. Be specific to Bettina's voice — not generic."""

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": message.content[0].text}


def generate_brief(niche: str, idea: str) -> dict:
    """Generate a full content brief for a reel idea."""
    prompt = f"""{CREATOR_CONTEXT}

Create a content brief for a **{niche}** reel with this idea: "{idea}"

Structure the brief as:
**Hook (0–3s):** Opening line + visual action
**Build (3–15s):** What happens, what you show/say
**Payoff (15–30s):** The resolution, insight, or reveal
**CTA:** What you want viewers to do
**Caption starter:** First 1–2 lines of the caption (before hashtags)
**Suggested hashtags:** 5–7 relevant ones

Keep it practical and shootable — she films solo with her phone."""

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": message.content[0].text}


def generate_strategy_advice(stats: dict) -> dict:
    """Generate a personalised strategy read based on real analytics data."""
    prompt = f"""{CREATOR_CONTEXT}

Here are Bettina's current content analytics (personal reels only):
- Total reels: {stats.get('total_reels', 0)}
- Total views: {stats.get('total_views', 0)}
- Avg views per reel: {stats.get('avg_views', 0)}
- Avg engagement rate: {stats.get('avg_engagement_rate', 0)}%
- Avg saves per reel: {stats.get('avg_saves', 0)}
- Category breakdown: {stats.get('categories', 'N/A')}
- Best posting day: {stats.get('best_day', 'unknown')}

Give her a sharp, honest strategy read. Cover:
1. What's actually working and why (1–2 things max)
2. What's underperforming and a specific fix
3. One opportunity she's probably not seeing
4. A concrete action she can take this week

Be direct. Skip the fluff. Talk to her like a strategist, not a cheerleader."""

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": message.content[0].text}


def generate_series(concept: str, episode_count: int = 5) -> dict:
    """Generate a storytelling series plan."""
    prompt = f"""{CREATOR_CONTEXT}

Bettina wants to build a storytelling series. Concept: "{concept}"

Create a {episode_count}-episode series plan:
**Series title:** (catchy, specific to her voice)
**Series hook:** One line that makes someone want to follow the whole series
**Format:** Reel length + visual style recommendation

Then for each episode:
- Episode title
- 1-line premise (what happens / what's revealed)
- Opening hook line
- Cliffhanger or CTA into the next episode

Make it feel like content she could realistically film as a college student.
Lean into her Nigerian background and personality where it fits naturally."""

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": message.content[0].text}


def generate_trend_scout(niche: str) -> dict:
    """Surface content formats and angles trending in the given niche."""
    prompt = f"""{CREATOR_CONTEXT}

What content formats, angles, and hooks are currently performing well for creators in the
**{niche}** niche on Instagram Reels and TikTok?

Give Bettina:
1. **3 trending content formats** (with a brief description of the format)
2. **3 hook styles** that are landing well right now in this space
3. **1 underused angle** that fits her background and could stand out
4. **What to avoid** — formats that feel oversaturated

Be specific to her situation as a Nigerian college student.
Note: your knowledge has a cutoff so flag anything that may have shifted recently."""

    message = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"result": message.content[0].text}
