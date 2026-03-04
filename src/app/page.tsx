'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Summary, TopReel, Category, AudioType, GrowthPoint } from '@/lib/api'

export default function DashboardPage() {
  const [summary, setSummary]     = useState<Summary | null>(null)
  const [topReels, setTopReels]   = useState<TopReel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [audioTypes, setAudioTypes] = useState<AudioType[]>([])
  const [growth, setGrowth]       = useState<GrowthPoint[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.summary('personal'),
      api.topPerforming(5, 'personal'),
      api.categories(),
      api.audioTypes(),
      api.growth('personal'),
    ]).then(([s, t, c, a, g]) => {
      setSummary(s)
      setTopReels(t)
      setCategories(c.slice(0, 4))
      setAudioTypes(a.slice(0, 3))
      setGrowth(g)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()

  // Engagement rate from personal data
  const engRate = summary && summary.avg_views > 0
    ? ((summary.avg_engagement / summary.avg_views) * 100).toFixed(1) + '%'
    : '—'

  // Growth chart
  const maxViews = growth.length ? Math.max(...growth.map(g => g.video_views)) : 1

  // Category chart
  const maxCatViews = categories.length ? Math.max(...categories.map(c => c.avg_views)) : 1

  // Audio chart
  const maxAudioViews = audioTypes.length ? Math.max(...audioTypes.map(a => a.avg_views)) : 1

  // Content score (engagement rate scaled 0-100)
  const contentScore = summary
    ? Math.min(100, Math.round(summary.avg_engagement_rate * 8))
    : 0
  const ringOffset = Math.round(283 - (contentScore / 100) * 283)

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
                <div className="panel-label">Views — chronological</div>
              </div>
            </div>

            <div className="chart-area">
              {growth.map((pt, i) => {
                const pct = (pt.video_views / maxViews * 100).toFixed(1)
                const cls = parseFloat(pct) > 80 ? 'hi' : parseFloat(pct) < 40 ? 'lo' : ''
                return (
                  <div key={pt.reel_id} className="bar-group" title={`${fmtViews(pt.video_views)} views`}>
                    <div
                      className={`bar-fill ${cls}`}
                      style={{ height: `${pct}%`, animationDelay: `${i * 0.06}s` }}
                    />
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {growth.length > 0 && (
                <>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                    {fmtDate(growth[0].posted_at)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                    {fmtDate(growth[growth.length - 1].posted_at)}
                  </span>
                </>
              )}
            </div>
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

          {/* Category breakdown */}
          <div className="panel" style={{ animationDelay: '0.4s' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Categories</div>
                <div className="panel-label">Avg views by type</div>
              </div>
            </div>
            {categories.map(c => (
              <div key={c.category} className="breakdown-item">
                <div className="breakdown-name">{c.category}</div>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar-fill" style={{ width: `${(c.avg_views / maxCatViews * 100).toFixed(0)}%` }} />
                </div>
                <div className="breakdown-val">{fmtViews(c.avg_views)}</div>
              </div>
            ))}
          </div>

          {/* Audio + ring */}
          <div className="panel" style={{ animationDelay: '0.45s' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Audio Performance</div>
                <div className="panel-label">Avg views by audio type</div>
              </div>
            </div>

            <div className="score-ring-wrap">
              <div className="score-ring">
                <svg viewBox="0 0 110 110">
                  <circle className="ring-track" cx="55" cy="55" r="45" />
                  <circle
                    className="ring-fill"
                    cx="55" cy="55" r="45"
                    style={{ strokeDashoffset: ringOffset }}
                  />
                </svg>
                <div className="score-center">
                  <div className="score-num">{contentScore}</div>
                  <div className="score-denom">/100</div>
                </div>
              </div>
              <div className="score-label">Content Score</div>
              <div className="score-sublabel">{summary?.avg_engagement_rate.toFixed(1)}% avg engagement rate</div>
            </div>

            {audioTypes.map(a => (
              <div key={a.audio_type} className="breakdown-item">
                <div className="breakdown-name">{a.audio_type}</div>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar-fill" style={{ width: `${(a.avg_views / maxAudioViews * 100).toFixed(0)}%` }} />
                </div>
                <div className="breakdown-val">{fmtViews(a.avg_views)}</div>
              </div>
            ))}
          </div>

          {/* Predict CTA */}
          <div className="predict-panel" style={{ animationDelay: '0.5s' }}>
            <div>
              <div className="predict-eyebrow">ML Powered</div>
              <div className="predict-headline">Predict your next reel's performance</div>
              <div className="predict-desc">
                Enter your hook text, duration, category, and audio type. The model returns predicted views, a virality probability score, and content recommendations.
              </div>
            </div>
            <Link href="/predict" className="predict-btn">
              Run Prediction
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
