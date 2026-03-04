'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Reel } from '@/lib/api'

export default function ReelsPage() {
  const [reels, setReels]   = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.reels('personal')
      .then(data => { setReels(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Reels <span>Library</span></div>
        <div className="topbar-right">
          <div className="live-badge">
            <div className="live-dot" />
            {reels.length} reels
          </div>
        </div>
      </div>

      <div className="main">
        {loading ? (
          <div className="state-empty">LOADING REELS<br />→ fetching from backend</div>
        ) : reels.length === 0 ? (
          <div className="state-empty">NO REELS FOUND<br />→ run POST /ingest to seed data</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {reels.map((reel) => {
              const insight = reel.insights?.[0]
              const views = insight?.video_views ?? 0
              const engagement = insight?.engagement ?? 0
              const saves = insight?.saves ?? 0
              const engRate = views > 0 ? ((engagement / views) * 100).toFixed(1) : '0'

              return (
                <Link
                  key={reel.id}
                  href={`/reels/${reel.id}`}
                  className="panel"
                  style={{ cursor: 'pointer', padding: 20, textDecoration: 'none', display: 'block', animation: 'fadeUp 0.4s ease both' }}
                >
                  {/* Thumbnail placeholder */}
                  <div style={{
                    aspectRatio: '9/16',
                    background: 'linear-gradient(160deg, var(--bg-2), var(--accent-glow))',
                    borderRadius: 4,
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--accent-border)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-script)', fontSize: 22, color: 'var(--accent-soft)' }}>
                      reel
                    </span>
                  </div>

                  {/* Caption */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                    letterSpacing: '0.03em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {reel.hook_text || reel.caption || reel.id}
                  </div>

                  {/* Meta */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 12,
                  }}>
                    {reel.category} {reel.posted_at ? `· ${fmtDate(reel.posted_at)}` : ''}
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['Views', fmtViews(views)], ['Eng', `${engRate}%`], ['Saves', saves]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
