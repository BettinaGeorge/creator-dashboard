'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Summary, TopReel, Category, GrowthPoint } from '@/lib/api'

// ── Period options ──────────────────────────────────────────────────
const PERIODS = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: null },
] as const

type PeriodLabel = typeof PERIODS[number]['label']

// ── Chart metric options ────────────────────────────────────────────
const METRICS = ['Views', 'Interactions'] as const
type ChartMetric = typeof METRICS[number]

function fromDateFor(days: number | null): string | undefined {
  if (!days) return undefined
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

// ── Small pill button ───────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '6px 14px',
        borderRadius: 20,
        border: active ? '1px solid var(--accent-border)' : '1px solid var(--border-soft)',
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent-soft)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export default function DashboardPage() {
  const [period, setPeriod]       = useState<PeriodLabel>('All')
  const [metric, setMetric]       = useState<ChartMetric>('Views')
  const [catMetric, setCatMetric] = useState<'Views' | 'Saves' | 'Reels' | 'Eng Rate'>('Views')
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [topReels, setTopReels]   = useState<TopReel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [growth, setGrowth]       = useState<GrowthPoint[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback((p: PeriodLabel) => {
    const days = PERIODS.find(x => x.label === p)?.days ?? null
    const from = fromDateFor(days)
    setLoading(true)
    Promise.all([
      api.summary('personal', from),
      api.topPerforming(5, 'personal'),
      api.categories('personal'),
      api.growth('personal', from),
    ]).then(([s, t, c, g]) => {
      setSummary(s)
      setTopReels(t)
      setCategories(c)
      setGrowth(g)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load(period) }, [period, load])

  const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()

  const engRate = summary && summary.avg_views > 0
    ? ((summary.avg_engagement / summary.avg_views) * 100).toFixed(1) + '%'
    : '—'

  // Chart bars — Views = raw video views; Interactions = saves + shares (high-intent only)
  const chartValue = (pt: GrowthPoint) =>
    metric === 'Views' ? pt.video_views : (pt.saves ?? 0) + (pt.shares ?? 0)

  const maxChart = growth.length ? Math.max(...growth.map(chartValue), 1) : 1

  const catValue = (c: typeof categories[0]) => {
    if (catMetric === 'Views')    return c.avg_views
    if (catMetric === 'Saves')    return c.avg_saves
    if (catMetric === 'Reels')    return c.reel_count
    return c.avg_views > 0 ? (c.avg_engagement / c.avg_views) * 100 : 0
  }
  const catLabel = (c: typeof categories[0]) => {
    if (catMetric === 'Views')    return fmtViews(c.avg_views)
    if (catMetric === 'Saves')    return String(c.avg_saves)
    if (catMetric === 'Reels')    return `${c.reel_count}`
    return c.avg_views > 0 ? `${((c.avg_engagement / c.avg_views) * 100).toFixed(1)}%` : '0%'
  }
  const maxCatValue = categories.length ? Math.max(...categories.map(catValue), 1) : 1


  if (loading) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title">Overview <span>Dashboard</span></div>
        </div>
        <div className="main">
          <div className="state-empty">LOADING DATA<br />→ connecting to backend</div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Overview <span>Dashboard</span></div>
        </div>
        <div className="topbar-right">
          {/* Period filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <Pill
                key={p.label}
                label={p.label}
                active={period === p.label}
                onClick={() => setPeriod(p.label)}
              />
            ))}
          </div>
          <div className="topbar-date">{now}</div>
          <div className="live-badge">
            <div className="live-dot" />
            Live data
          </div>
        </div>
      </div>

      <div className="main">

        {/* ── STAT CARDS ── */}
        <div className="stats-row">
          <div className="stat-card featured">
            <div className="stat-label">Total Views</div>
            <div className="stat-value">{summary ? fmtViews(summary.total_views) : '—'}</div>
            <div className="stat-delta">across {summary?.total_reels ?? 0} reels</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Engagement</div>
            <div className="stat-value">{engRate}</div>
            <div className="stat-delta delta-up">per impression</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Saves</div>
            <div className="stat-value">{summary ? fmtViews(summary.total_saves) : '—'}</div>
            <div className="stat-delta">high-intent signal</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Reels Posted</div>
            <div className="stat-value">{summary?.total_reels ?? '—'}</div>
            <div className="stat-delta">personal account</div>
          </div>
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="charts-row">

          {/* Growth trend */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Growth Trend</div>
                <div className="panel-label">
                  {metric === 'Views'
                    ? 'Video views per reel'
                    : 'Saves + shares per reel (high-intent actions)'
                  } — {growth.length} reel{growth.length !== 1 ? 's' : ''}
                </div>
              </div>
              {/* Chart metric toggle */}
              <div style={{ display: 'flex', gap: 4 }}>
                {METRICS.map(m => (
                  <Pill key={m} label={m} active={metric === m} onClick={() => setMetric(m)} />
                ))}
              </div>
            </div>

            {growth.length === 0 ? (
              <div className="state-empty" style={{ height: 140 }}>
                NO DATA FOR THIS PERIOD
              </div>
            ) : (
              <>
                <div className="chart-area">
                  {growth.map((pt, i) => {
                    const val = chartValue(pt)
                    const pct = (val / maxChart * 100).toFixed(1)
                    const cls = parseFloat(pct) > 80 ? 'hi' : parseFloat(pct) < 40 ? 'lo' : ''
                    const tip = metric === 'Views'
                      ? `${fmtViews(pt.video_views)} views`
                      : `${fmtViews((pt.saves ?? 0) + (pt.shares ?? 0))} saves+shares`
                    return (
                      <div key={pt.reel_id} className="bar-group" title={tip}>
                        <div
                          className={`bar-fill ${cls}`}
                          style={{ height: `${pct}%`, animationDelay: `${i * 0.06}s` }}
                        />
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                    {fmtDate(growth[0].posted_at)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                    {fmtDate(growth[growth.length - 1].posted_at)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Top reels */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Top Reels</div>
                <div className="panel-label">By total views</div>
              </div>
            </div>

            {topReels.map((r, i) => {
              const maxV = topReels[0]?.video_views || 1
              return (
                <Link key={r.reel_id} href={`/reels/${r.reel_id}`} className="reel-item">
                  <div className="reel-rank">{i + 1}</div>
                  <div className="reel-info">
                    <div className="reel-caption">{r.hook_text || r.reel_id}</div>
                    <div className="reel-meta">{r.category} · {r.audio_type}</div>
                    <div className="reel-bar">
                      <div className="reel-bar-fill" style={{ width: `${(r.video_views / maxV * 100).toFixed(0)}%` }} />
                    </div>
                  </div>
                  <div className="reel-views">{fmtViews(r.video_views)}</div>
                </Link>
              )
            })}
          </div>

        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="bottom-row">

          <div className="panel" style={{ animationDelay: '0.4s', gridColumn: 'span 2' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Niches</div>
                <div className="panel-label">
                  {catMetric === 'Views'    ? 'Avg views per reel' :
                   catMetric === 'Saves'    ? 'Avg saves per reel — high intent' :
                   catMetric === 'Reels'    ? 'Reels posted — where you invest time' :
                   'Engagement rate — interactions / views'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
              {(['Views', 'Saves', 'Reels', 'Eng Rate'] as const).map(m => (
                <button key={m} onClick={() => setCatMetric(m)} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                  padding: '4px 10px', borderRadius: 20,
                  border: catMetric === m ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                  background: catMetric === m ? 'var(--accent-glow)' : 'transparent',
                  color: catMetric === m ? 'var(--accent-soft)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{m}</button>
              ))}
            </div>

            {categories.length === 0 ? (
              <div className="state-empty" style={{ height: 80 }}>
                Tag your reels to see niche breakdown
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                {[...categories].sort((a, b) => catValue(b) - catValue(a)).map(c => (
                  <div key={c.category} className="breakdown-item">
                    <div className="breakdown-name">{c.category}</div>
                    <div className="breakdown-bar-wrap">
                      <div className="breakdown-bar-fill" style={{ width: `${(catValue(c) / maxCatValue * 100).toFixed(0)}%` }} />
                    </div>
                    <div className="breakdown-val">{catLabel(c)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="predict-panel" style={{ animationDelay: '0.5s', opacity: 0.5, filter: 'grayscale(0.4)' }}>
            <div>
              <div className="predict-eyebrow" style={{ color: 'var(--text-muted)' }}>Coming back soon</div>
              <div className="predict-headline" style={{ opacity: 0.7 }}>ML Predictor — paused</div>
              <div className="predict-desc">
                Model needs real per-reel metrics to be accurate. Will reactivate when Instagram Graph API is connected.
              </div>
            </div>
            <Link href="/studio" className="predict-btn">
              Try AI Studio instead
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                <line x1="1" y1="6" x2="11" y2="6" />
                <polyline points="7,2 11,6 7,10" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
