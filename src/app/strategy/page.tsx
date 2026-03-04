'use client'

import { useEffect, useState } from 'react'
import { api, fmtViews, Category, AudioType, TopReel } from '@/lib/api'

export default function StrategyPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [audioTypes, setAudioTypes] = useState<AudioType[]>([])
  const [topHooks, setTopHooks]     = useState<TopReel[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.categories(),
      api.audioTypes(),
      api.topPerforming(8, 'personal'),
    ]).then(([c, a, h]) => {
      setCategories(c)
      setAudioTypes(a)
      setTopHooks(h.filter(r => r.hook_text))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const maxCat   = categories.length ? Math.max(...categories.map(c => c.avg_views)) : 1
  const maxAudio = audioTypes.length ? Math.max(...audioTypes.map(a => a.avg_views)) : 1

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Content <span>Strategy</span></div>
        <div className="topbar-right">
          <div className="topbar-date">All data</div>
        </div>
      </div>

      <div className="main">
        {loading ? (
          <div className="state-empty">LOADING STRATEGY<br />→ fetching analytics</div>
        ) : (
          <div className="page-grid-2">

            {/* Category intelligence */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Category Intelligence</div>
                  <div className="panel-label">Average views by content type</div>
                </div>
              </div>
              {categories.slice(0, 8).map(c => (
                <div key={c.category} className="breakdown-item">
                  <div className="breakdown-name">{c.category}</div>
                  <div className="breakdown-bar-wrap" style={{ flex: 2 }}>
                    <div className="breakdown-bar-fill" style={{ width: `${(c.avg_views / maxCat * 100).toFixed(0)}%` }} />
                  </div>
                  <div className="breakdown-val">{fmtViews(c.avg_views)}</div>
                </div>
              ))}
            </div>

            {/* Hook analysis */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.1s' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Hook Analysis</div>
                  <div className="panel-label">Top performing openers — personal reels</div>
                </div>
              </div>
              {topHooks.length === 0 ? (
                <div className="state-empty" style={{ height: 120 }}>No personal hooks yet</div>
              ) : (
                topHooks.map((r) => {
                  const maxV = topHooks[0]?.video_views || 1
                  const score = Math.round((r.video_views / maxV) * 100)
                  return (
                    <div key={r.reel_id} className="breakdown-item">
                      <div className="breakdown-name" style={{ fontSize: 9, fontStyle: 'italic', flex: 2 }}>
                        "{r.hook_text}"
                      </div>
                      <div className="breakdown-bar-wrap">
                        <div className="breakdown-bar-fill" style={{ width: `${score}%` }} />
                      </div>
                      <div className="breakdown-val">{score}</div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Audio type cards */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.2s', gridColumn: '1 / -1' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">Audio Type vs Performance</div>
                  <div className="panel-label">Avg views by audio type</div>
                </div>
              </div>
              <div className="audio-types-grid">
                {audioTypes.slice(0, 4).map(a => (
                  <div key={a.audio_type} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 4,
                    padding: 18,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {a.audio_type}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--accent-soft)', lineHeight: 1, marginBottom: 4 }}>
                      {fmtViews(a.avg_views)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                      avg views
                    </div>
                    <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                      {a.reel_count} reels
                    </div>
                    <div style={{ marginTop: 12, height: 3, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(a.avg_views / maxAudio * 100).toFixed(0)}%`,
                        background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}
