'use client'

import { useEffect, useState } from 'react'
import { api, fmtViews, fmtDate, Category, TopReel, GrowthPoint } from '@/lib/api'

export default function StrategyPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [topHooks, setTopHooks]     = useState<TopReel[]>([])
  const [growth, setGrowth]         = useState<GrowthPoint[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.categories('personal'),
      api.topPerforming(8, 'personal'),
      api.growth('personal'),
    ]).then(([c, h, g]) => {
      setCategories(c)
      setTopHooks(h.filter(r => r.hook_text))
      setGrowth(g)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Engagement rate per category (engagement / views)
  const catsWithRate = categories.map(c => ({
    ...c,
    eng_rate: c.avg_views > 0 ? (c.avg_engagement / c.avg_views) * 100 : 0,
  })).sort((a, b) => b.eng_rate - a.eng_rate)

  const maxEngRate = catsWithRate.length ? Math.max(...catsWithRate.map(c => c.eng_rate)) : 1

  // Group growth by month for posting cadence
  const byMonth: Record<string, { count: number; total_views: number }> = {}
  growth.forEach(g => {
    if (!g.posted_at) return
    const key = g.posted_at.slice(0, 7) // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { count: 0, total_views: 0 }
    byMonth[key].count++
    byMonth[key].total_views += g.video_views
  })
  const months = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // last 6 months
  const maxMonthViews = months.length ? Math.max(...months.map(([, v]) => v.total_views)) : 1

  // Top reel (for recommendation callout)
  const topReel = topHooks[0]
  const worstCat = [...catsWithRate].sort((a, b) => a.eng_rate - b.eng_rate)[0]
  const bestCat  = catsWithRate[0]

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Content <span>Strategy</span></div>
        <div className="topbar-right">
          <div className="topbar-date">Personal reels only</div>
        </div>
      </div>

      <div className="main">
        {loading ? (
          <div className="state-empty">LOADING STRATEGY<br />→ fetching your data</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recommendation callout */}
            {bestCat && worstCat && bestCat.category !== worstCat.category && (
              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent-border)',
                borderRadius: 6,
                padding: '16px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-secondary)',
                letterSpacing: '0.05em',
                lineHeight: 1.7,
              }}>
                <span style={{ color: 'var(--accent-soft)', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 8 }}>
                  → Insight
                </span>
                <br />
                Your <strong style={{ color: 'var(--text-primary)' }}>{bestCat.category}</strong> content
                has your highest engagement rate ({bestCat.eng_rate.toFixed(1)}%).
                {worstCat && ` Your ${worstCat.category} content is your lowest at ${worstCat.eng_rate.toFixed(1)}% — consider adjusting your hook or format there.`}
              </div>
            )}

            <div className="page-grid-2">

              {/* Content Pillars — engagement rate, personal only */}
              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Your Content Pillars</div>
                    <div className="panel-label">Engagement rate by category — personal reels</div>
                  </div>
                </div>
                {catsWithRate.length === 0 ? (
                  <div className="state-empty" style={{ height: 100 }}>No category data yet</div>
                ) : (
                  catsWithRate.map(c => (
                    <div key={c.category} className="breakdown-item">
                      <div className="breakdown-name">{c.category}</div>
                      <div className="breakdown-bar-wrap" style={{ flex: 2 }}>
                        <div className="breakdown-bar-fill" style={{ width: `${(c.eng_rate / maxEngRate * 100).toFixed(0)}%` }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 54 }}>
                        <div className="breakdown-val">{c.eng_rate.toFixed(1)}%</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                          {c.reel_count} reels
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Top hooks — personal only (already filtered correctly) */}
              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.1s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Top Performing Hooks</div>
                    <div className="panel-label">Your best openers by views</div>
                  </div>
                </div>
                {topHooks.length === 0 ? (
                  <div className="state-empty" style={{ height: 100 }}>No hook data yet</div>
                ) : (
                  topHooks.map((r) => {
                    const maxV  = topHooks[0]?.video_views || 1
                    const score = Math.round((r.video_views / maxV) * 100)
                    return (
                      <div key={r.reel_id} className="breakdown-item">
                        <div className="breakdown-name" style={{ fontSize: 9, fontStyle: 'italic', flex: 2 }}>
                          "{r.hook_text}"
                        </div>
                        <div className="breakdown-bar-wrap">
                          <div className="breakdown-bar-fill" style={{ width: `${score}%` }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 40 }}>
                          <div className="breakdown-val">{fmtViews(r.video_views)}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)' }}>
                            {r.category}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

            </div>

            {/* Posting cadence — views by month */}
            {months.length > 0 && (
              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.2s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Posting Cadence</div>
                    <div className="panel-label">Reels posted + total views per month — personal</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: 12, alignItems: 'end', height: 120 }}>
                  {months.map(([month, data]) => (
                    <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                        {fmtViews(data.total_views)}
                      </div>
                      <div style={{
                        width: '100%',
                        height: `${Math.max(8, (data.total_views / maxMonthViews) * 72)}px`,
                        background: 'linear-gradient(180deg, var(--accent-soft), var(--accent))',
                        borderRadius: '2px 2px 0 0',
                        opacity: 0.8,
                      }} />
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em', textAlign: 'center' }}>
                        {month.slice(5)}/{month.slice(2, 4)}
                        <br />
                        <span style={{ color: 'var(--text-secondary)' }}>{data.count}×</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}
