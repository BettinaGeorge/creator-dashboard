'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Reel, ReelTag, CATEGORIES, CategoryName } from '@/lib/api'

export default function ReelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [reel, setReel]         = useState<Reel | null>(null)
  const [tags, setTags]         = useState<ReelTag | null>(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [allIds, setAllIds]     = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    Promise.all([api.reel(id), api.getTags(id), api.reels('personal')])
      .then(([data, tagData, all]) => {
        setReel(data)
        setTags(tagData)
        // Sort by latest posted (same default as library)
        const sorted = [...all].sort((a, b) =>
          new Date(b.posted_at ?? 0).getTime() - new Date(a.posted_at ?? 0).getTime()
        )
        setAllIds(sorted.map(r => r.id))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const currentIdx = allIds.indexOf(id)
  const prevId = currentIdx > 0 ? allIds[currentIdx - 1] : null
  const nextId = currentIdx < allIds.length - 1 ? allIds[currentIdx + 1] : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft'  && prevId) router.push(`/reels/${prevId}`)
      if (e.key === 'ArrowRight' && nextId) router.push(`/reels/${nextId}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevId, nextId, router])

  const updateTags = useCallback(async (category: CategoryName | null, storytelling: boolean) => {
    if (!id) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.setTags(id, { category, storytelling })
      setTags(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [id])

  const toggleCategory = (cat: CategoryName) => {
    const current = tags?.category ?? null
    updateTags(current === cat ? null : cat, tags?.storytelling ?? false)
  }

  const toggleStorytelling = () => {
    updateTags(tags?.category ?? null, !(tags?.storytelling ?? false))
  }

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
            ← Library
          </Link>
          {allIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => prevId && router.push(`/reels/${prevId}`)}
                disabled={!prevId}
                title="Previous reel"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 18,
                  padding: '4px 14px', borderRadius: 6, cursor: prevId ? 'pointer' : 'default',
                  border: '1px solid var(--border-soft)', background: 'transparent',
                  color: prevId ? 'var(--text-muted)' : 'var(--border-soft)',
                  lineHeight: 1, transition: 'all 0.15s',
                }}
              >
                ‹
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                {currentIdx + 1} / {allIds.length}
              </span>
              <button
                onClick={() => nextId && router.push(`/reels/${nextId}`)}
                disabled={!nextId}
                title="Next reel"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 18,
                  padding: '4px 14px', borderRadius: 6, cursor: nextId ? 'pointer' : 'default',
                  border: '1px solid var(--border-soft)', background: 'transparent',
                  color: nextId ? 'var(--text-muted)' : 'var(--border-soft)',
                  lineHeight: 1, transition: 'all 0.15s',
                }}
              >
                ›
              </button>
            </div>
          )}
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
              position: 'relative',
              aspectRatio: '9/16',
              borderRadius: 6,
              overflow: 'hidden',
              background: 'linear-gradient(160deg, var(--bg-2), var(--accent-glow))',
              border: '1px solid var(--accent-border)',
            }}>
              {reel.video_url ? (
                <video
                  src={`${process.env.NEXT_PUBLIC_API_URL}${reel.video_url}`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-script)', fontSize: 28, color: 'var(--accent-soft)' }}>
                    {reel.category || 'reel'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2 — Caption + Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Header card */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 6 }}>
                {reel.caption || reel.hook_text || reel.id}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                {[
                  tags?.category ?? reel.category,
                  tags?.storytelling ? 'Storytelling' : null,
                  reel.audio_type ? `${reel.audio_type} audio` : null,
                  reel.duration ? `${reel.duration}s` : null,
                ].filter(Boolean).join(' · ')}
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

            {/* Content Tags */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.05s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div className="panel-title" style={{ marginBottom: 2 }}>Content Tags</div>
                  <div className="panel-label">Tags override auto-detection and survive reingests</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: saved ? 'var(--accent-soft)' : 'var(--text-muted)', transition: 'color 0.3s' }}>
                  {saving ? 'SAVING...' : saved ? '✓ SAVED' : ''}
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Primary niche
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => {
                  const active = tags?.category === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
                        padding: '7px 16px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                        border: active ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                        background: active ? 'var(--accent-glow)' : 'transparent',
                        color: active ? 'var(--accent-soft)' : 'var(--text-muted)',
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                Format
              </div>
              <button
                onClick={toggleStorytelling}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
                  padding: '7px 16px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                  border: tags?.storytelling ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                  background: tags?.storytelling ? 'var(--accent-glow)' : 'transparent',
                  color: tags?.storytelling ? 'var(--accent-soft)' : 'var(--text-muted)',
                }}
              >
                Storytelling
              </button>
              {tags?.storytelling && tags?.category && (
                <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  Tagged as {tags.category} · Storytelling
                </div>
              )}
            </div>

          </div>

          {/* Col 3 — Metrics + Engagement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Metric cards 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Views', fmtViews(views)], ['Reach', fmtViews(reach)], ['Saves', saves], ['Shares', shares]].map(([label, val]) => (
                <div key={label} className="panel" style={{ animation: 'fadeUp 0.4s ease both', textAlign: 'center', padding: 20 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--accent-soft)' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Engagement breakdown */}
            <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.1s', flex: 1 }}>
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
