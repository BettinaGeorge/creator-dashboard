'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { api, fmtViews, Category, TopReel, GrowthPoint, Reel } from '@/lib/api'

export default function InsightsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [topHooks,   setTopHooks]   = useState<TopReel[]>([])
  const [growth,     setGrowth]     = useState<GrowthPoint[]>([])
  const [reels,      setReels]      = useState<Reel[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pillarMetric, setPillarMetric] = useState<'views' | 'count'>('views')

  useEffect(() => {
    Promise.all([
      api.categories('personal'),
      api.topPerforming(8, 'personal'),
      api.growth('personal'),
      api.reels('personal'),
    ]).then(([c, h, g, r]) => {
      setCategories(c)
      setTopHooks(h.filter(x => x.hook_text))
      setGrowth(g)
      setReels(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── Content Pillars ────────────────────────────────────────────────────────
  const catsWithRate = useMemo(() =>
    [...categories].sort((a, b) =>
      pillarMetric === 'views'
        ? b.avg_views - a.avg_views
        : b.reel_count - a.reel_count
    )
  , [categories, pillarMetric])

  const maxPillarVal = Math.max(...catsWithRate.map(c =>
    pillarMetric === 'views' ? c.avg_views : c.reel_count), 1)

  // ── Hook Length Patterns ───────────────────────────────────────────────────
  const hookLengthData = useMemo(() => {
    const buckets = {
      'ultra': { label: '1–4 words',  total: 0, count: 0 },
      'short': { label: '5–8 words',  total: 0, count: 0 },
      'mid':   { label: '9–12 words', total: 0, count: 0 },
      'long':  { label: '13+ words',  total: 0, count: 0 },
    }
    growth.forEach(pt => {
      if (!pt.hook_text) return
      const words = pt.hook_text.trim().split(/\s+/).length
      const key = words <= 4 ? 'ultra' : words <= 8 ? 'short' : words <= 12 ? 'mid' : 'long'
      buckets[key as keyof typeof buckets].total += pt.video_views
      buckets[key as keyof typeof buckets].count++
    })
    return Object.entries(buckets).map(([key, v]) => ({
      key, label: v.label,
      avg:   v.count > 0 ? Math.round(v.total / v.count) : 0,
      count: v.count,
    }))
  }, [growth])

  const maxHookAvg = Math.max(...hookLengthData.map(d => d.avg), 1)

  // ── Duration vs Performance ────────────────────────────────────────────────
  const durationData = useMemo(() => {
    const buckets = {
      short: { label: '< 15s',   total: 0, count: 0 },
      mid:   { label: '15–30s',  total: 0, count: 0 },
      long:  { label: '> 30s',   total: 0, count: 0 },
    }
    reels.forEach(r => {
      const views = r.insights?.[0]?.video_views ?? 0
      if (!views || r.duration === null) return
      const key = r.duration < 15 ? 'short' : r.duration <= 30 ? 'mid' : 'long'
      buckets[key as keyof typeof buckets].total += views
      buckets[key as keyof typeof buckets].count++
    })
    return Object.entries(buckets).map(([key, v]) => ({
      key, label: v.label,
      avg:   v.count > 0 ? Math.round(v.total / v.count) : 0,
      count: v.count,
    }))
  }, [reels])

  const maxDurAvg = Math.max(...durationData.map(d => d.avg), 1)

  // ── Posting Cadence + MoM ─────────────────────────────────────────────────
  const months = useMemo(() => {
    const byMonth: Record<string, { count: number; total_views: number }> = {}
    growth.forEach(g => {
      if (!g.posted_at) return
      const key = g.posted_at.slice(0, 7)
      if (!byMonth[key]) byMonth[key] = { count: 0, total_views: 0 }
      byMonth[key].count++
      byMonth[key].total_views += g.video_views
    })
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  }, [growth])

  const maxMonthViews = Math.max(...months.map(([, v]) => v.total_views), 1)

  const momChange = months.length >= 2 ? (() => {
    const prev = months[months.length - 2][1].total_views
    const curr = months[months.length - 1][1].total_views
    return prev > 0 ? Math.round((curr - prev) / prev * 100) : null
  })() : null

  // ── Auto-observations ─────────────────────────────────────────────────────
  const catsByViews = useMemo(() =>
    [...categories].sort((a, b) => b.avg_views - a.avg_views)
  , [categories])
  const bestCat  = catsByViews[0]
  const worstCat = catsByViews[catsByViews.length - 1]

  const bestHookLen = hookLengthData.filter(d => d.count > 0)
    .reduce((best, d) => d.avg > best.avg ? d : best, hookLengthData[0])

  const observations = [
    bestCat && worstCat && bestCat.category !== worstCat.category && bestCat.avg_views > 0
      ? `Your ${bestCat.category} content averages ${fmtViews(bestCat.avg_views)} views per reel — ${worstCat.category} averages ${fmtViews(worstCat.avg_views)}.`
      : null,
    bestHookLen?.count > 0
      ? `Hooks in the ${bestHookLen.label} range average ${fmtViews(bestHookLen.avg)} views — your sweet spot.`
      : null,
    momChange !== null
      ? `Views ${momChange >= 0 ? 'up' : 'down'} ${Math.abs(momChange)}% last month vs the month before.`
      : null,
  ].filter(Boolean) as string[]

  // ── Shared bar chart helper ───────────────────────────────────────────────
  function BarChart({ data, maxVal }: {
    data: { key: string; label: string; avg: number; count: number }[]
    maxVal: number
  }) {
    const best = data.reduce((b, d) => d.avg > b.avg ? d : b, data[0])
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 10, alignItems: 'end', height: 110, marginTop: 12 }}>
        {data.map(d => {
          const isBest = d.key === best.key && d.avg > 0
          return (
            <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isBest ? 'var(--accent-soft)' : 'var(--text-muted)', textAlign: 'center' }}>
                {d.avg > 0 ? fmtViews(d.avg) : '—'}
              </div>
              <div style={{
                width: '100%',
                height: `${Math.max(4, (d.avg / maxVal) * 64)}px`,
                background: isBest
                  ? 'linear-gradient(180deg, var(--accent-soft), var(--accent))'
                  : 'var(--border)',
                borderRadius: '2px 2px 0 0',
                opacity: d.count === 0 ? 0.2 : 0.85,
                transition: 'height 0.4s ease',
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: isBest ? 'var(--accent-soft)' : 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  {d.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)' }}>
                  {d.count} reel{d.count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Content <span>Insights</span></div>
        <div className="topbar-right">
          <div className="topbar-date">Personal reels only</div>
        </div>
      </div>

      <div className="main">
        {loading ? (
          <div className="state-empty">LOADING INSIGHTS<br />→ analysing your data</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Auto-observations ── */}
            {observations.length > 0 && (
              <div style={{
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent-border)',
                borderRadius: 6,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent-soft)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  → What your data is saying
                </div>
                {observations.map((obs, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-secondary)', letterSpacing: '0.03em', lineHeight: 1.6,
                    paddingLeft: 12, borderLeft: '2px solid var(--accent-border)',
                  }}>
                    {obs}
                  </div>
                ))}
              </div>
            )}

            {/* ── Row 1: Content Pillars + Top Hooks ── */}
            <div className="page-grid-2">

              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Content Pillars</div>
                    <div className="panel-label">
                      {pillarMetric === 'views' ? 'Avg views per reel by niche' : 'Number of reels per niche'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['views', 'count'] as const).map(m => (
                      <button key={m} onClick={() => setPillarMetric(m)} style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                        padding: '4px 10px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                        border: pillarMetric === m ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                        background: pillarMetric === m ? 'var(--accent-glow)' : 'transparent',
                        color: pillarMetric === m ? 'var(--accent-soft)' : 'var(--text-muted)',
                      }}>{m === 'views' ? 'Avg Views' : 'Reel Count'}</button>
                    ))}
                  </div>
                </div>
                {catsWithRate.length === 0 ? (
                  <div className="state-empty" style={{ height: 100 }}>No category data — tag your reels first</div>
                ) : catsWithRate.map(c => {
                  const val = pillarMetric === 'views' ? c.avg_views : c.reel_count
                  return (
                    <div key={c.category} className="breakdown-item">
                      <div className="breakdown-name">{c.category}</div>
                      <div className="breakdown-bar-wrap" style={{ flex: 2 }}>
                        <div className="breakdown-bar-fill" style={{ width: `${(val / maxPillarVal * 100).toFixed(0)}%` }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 54 }}>
                        <div className="breakdown-val">
                          {pillarMetric === 'views' ? fmtViews(c.avg_views) : c.reel_count}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                          {pillarMetric === 'views' ? `${c.reel_count} reels` : 'reels'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.1s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Top Performing Hooks</div>
                    <div className="panel-label">Your best openers by views — click to open reel</div>
                  </div>
                </div>
                {topHooks.length === 0 ? (
                  <div className="state-empty" style={{ height: 100 }}>No hook data yet</div>
                ) : topHooks.map(r => {
                  const maxV  = topHooks[0]?.video_views || 1
                  return (
                    <Link key={r.reel_id} href={`/reels/${r.reel_id}`} style={{ textDecoration: 'none' }}>
                      <div className="breakdown-item" style={{ cursor: 'pointer' }}>
                        <div className="breakdown-name" style={{ fontSize: 9, fontStyle: 'italic', flex: 2 }}>
                          "{r.hook_text}"
                        </div>
                        <div className="breakdown-bar-wrap">
                          <div className="breakdown-bar-fill" style={{ width: `${Math.round(r.video_views / maxV * 100)}%` }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 40 }}>
                          <div className="breakdown-val">{fmtViews(r.video_views)}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)' }}>{r.category}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

            </div>

            {/* ── Row 2: Duration + Hook Length ── */}
            <div className="page-grid-2">

              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.15s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Duration vs Performance</div>
                    <div className="panel-label">Avg views by reel length</div>
                  </div>
                </div>
                {durationData.every(d => d.count === 0) ? (
                  <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="state-empty" style={{ height: 60 }}>No duration data available</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '0.04em' }}>
                      Per-reel watch time requires the Instagram Graph API.
                      Will populate automatically once connected.
                    </div>
                  </div>
                ) : (
                  <BarChart data={durationData} maxVal={maxDurAvg} />
                )}
              </div>

              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.2s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Hook Length Patterns</div>
                    <div className="panel-label">Avg views by word count of opening line</div>
                  </div>
                </div>
                {hookLengthData.every(d => d.count === 0) ? (
                  <div className="state-empty" style={{ height: 100 }}>No hook text data yet</div>
                ) : (
                  <BarChart data={hookLengthData} maxVal={maxHookAvg} />
                )}
              </div>

            </div>

            {/* ── Row 3: Posting Cadence ── */}
            {months.length > 0 && (
              <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.25s' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Posting Cadence</div>
                    <div className="panel-label">
                      Total views + reels posted per month
                      {momChange !== null && (
                        <span style={{ marginLeft: 8, color: momChange >= 0 ? 'var(--accent-soft)' : 'var(--text-muted)' }}>
                          — {momChange >= 0 ? '▲' : '▼'} {Math.abs(momChange)}% vs last month
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: 12, alignItems: 'end', height: 120 }}>
                  {months.map(([month, data], i) => {
                    const isLatest = i === months.length - 1
                    const prevViews = i > 0 ? months[i - 1][1].total_views : null
                    const change = prevViews && prevViews > 0
                      ? Math.round((data.total_views - prevViews) / prevViews * 100)
                      : null
                    return (
                      <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                          {fmtViews(data.total_views)}
                          {change !== null && (
                            <div style={{ color: change >= 0 ? 'var(--accent-soft)' : 'var(--text-muted)', fontSize: 7 }}>
                              {change >= 0 ? '▲' : '▼'}{Math.abs(change)}%
                            </div>
                          )}
                        </div>
                        <div style={{
                          width: '100%',
                          height: `${Math.max(8, (data.total_views / maxMonthViews) * 72)}px`,
                          background: 'linear-gradient(180deg, var(--accent-soft), var(--accent))',
                          borderRadius: '2px 2px 0 0',
                          opacity: isLatest ? 0.9 : 0.5,
                        }} />
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em', textAlign: 'center' }}>
                          {month.slice(5)}/{month.slice(2, 4)}
                          <br />
                          <span style={{ color: 'var(--text-secondary)' }}>{data.count}×</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}
