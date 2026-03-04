'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Reel } from '@/lib/api'

export default function ReelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [reel, setReel]     = useState<Reel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.reel(id)
      .then(data => { setReel(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title">Reel <span>Detail</span></div>
        </div>
        <div className="main">
          <div className="state-empty">LOADING REEL<br />→ fetching data</div>
        </div>
      </>
    )
  }

  if (!reel) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title">Reel <span>Detail</span></div>
        </div>
        <div className="main">
          <div className="state-empty">REEL NOT FOUND<br />→ <Link href="/reels" style={{ color: 'var(--accent-soft)' }}>back to library</Link></div>
        </div>
      </>
    )
  }

  const insight = reel.insights?.[0]
  const views      = insight?.video_views ?? 0
  const reach      = insight?.reach ?? 0
  const engagement = insight?.engagement ?? 0
  const saves      = insight?.saves ?? 0
  const shares     = insight?.shares ?? 0
  const impressions = insight?.impressions ?? 0

  const engRate  = views > 0 ? ((engagement / views) * 100).toFixed(2) : '0'
  const saveRate = views > 0 ? ((saves / views) * 100).toFixed(2) : '0'
  const shareRate = views > 0 ? ((shares / views) * 100).toFixed(2) : '0'

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Reel <span>Detail</span></div>
        <div className="topbar-right">
          <Link href="/reels" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}>
            ← Back
          </Link>
          {reel.posted_at && (
            <div className="topbar-date">{fmtDate(reel.posted_at)}</div>
          )}
        </div>
      </div>

      <div className="main">
        <div className="reel-detail-layout">

          {/* Thumbnail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              aspectRatio: '9/16',
              background: 'linear-gradient(160deg, var(--bg-2), var(--accent-glow))',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--accent-border)',
            }}>
              <span style={{ fontFamily: 'var(--font-script)', fontSize: 28, color: 'var(--accent-soft)' }}>
                {reel.category || 'reel'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header card */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 6 }}>
                {reel.caption || reel.hook_text || reel.id}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                {[reel.category, reel.audio_type ? `${reel.audio_type} audio` : null, reel.duration ? `${reel.duration}s` : null].filter(Boolean).join(' · ')}
              </div>

              {reel.hook_text && (
                <>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                    Hook Text
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    padding: 12,
                    background: 'var(--accent-glow)',
                    borderLeft: '2px solid var(--accent)',
                    borderRadius: 2,
                  }}>
                    "{reel.hook_text}"
                  </div>
                </>
              )}
            </div>

            {/* Metric cards */}
            <div className="page-grid-4">
              {[['Views', fmtViews(views)], ['Reach', fmtViews(reach)], ['Saves', saves], ['Shares', shares]].map(([label, val]) => (
                <div key={label} className="panel" style={{ animation: 'fadeUp 0.4s ease both', textAlign: 'center', padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--accent-soft)' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Engagement breakdown */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.1s' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Engagement Breakdown</div>
                  <div className="panel-label">Rates relative to views</div>
                </div>
              </div>

              {[
                ['Engagement', engagement, engRate],
                ['Saves', saves, saveRate],
                ['Shares', shares, shareRate],
              ].map(([label, val, rate]) => (
                <div key={label as string} className="breakdown-item">
                  <div className="breakdown-name">{label}</div>
                  <div className="breakdown-bar-wrap">
                    <div className="breakdown-bar-fill" style={{ width: `${Math.min(100, parseFloat(rate as string) * 20).toFixed(0)}%` }} />
                  </div>
                  <div className="breakdown-val" style={{ fontSize: 11 }}>{rate}%</div>
                </div>
              ))}

              {impressions > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                  IMPRESSIONS: {fmtViews(impressions)}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
