'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { api, fmtViews, fmtDate, Reel, CATEGORIES } from '@/lib/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const NICHES   = [...CATEGORIES, 'Storytelling', 'Untagged'] as const
const DURATIONS = [
  { label: '< 15s',  key: 'short' },
  { label: '15–30s', key: 'mid'   },
  { label: '> 30s',  key: 'long'  },
]
const TIMEFRAMES = [
  { label: '1 month',  days: 30  },
  { label: '3 months', days: 90  },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
]
const SORT_OPTIONS = [
  { key: 'views',   label: 'Most viewed'         },
  { key: 'saves',   label: 'Most saved'           },
  { key: 'shares',  label: 'Most shared'          },
  { key: 'reach',   label: 'Most reached'         },
  { key: 'engRate', label: 'Highest eng. rate'    },
  { key: 'latest',  label: 'Latest posted'        },
  { key: 'oldest',  label: 'Oldest posted'        },
  { key: 'longest', label: 'Longest duration'     },
  { key: 'shortest',label: 'Shortest duration'    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function reelMetrics(reel: Reel) {
  const ins     = reel.insights?.[0]
  const views   = ins?.video_views  ?? 0
  const saves   = ins?.saves        ?? 0
  const shares  = ins?.shares       ?? 0
  const reach   = ins?.reach        ?? 0
  const eng     = ins?.engagement   ?? 0
  const engRate = views > 0 ? (eng / views) * 100 : 0
  return { views, saves, shares, reach, eng, engRate }
}

function durBucket(dur: number | null): string {
  if (dur === null) return 'unknown'
  if (dur < 15)  return 'short'
  if (dur <= 30) return 'mid'
  return 'long'
}

// ── Filter pill ───────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em',
      padding: '5px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
      border: active ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
      background: active ? 'var(--accent-glow)' : 'transparent',
      color: active ? 'var(--accent-soft)' : 'var(--text-muted)',
      whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const [reels, setReels]     = useState<Reel[]>([])
  const [tagMap, setTagMap]   = useState<Record<string, { category: string | null; storytelling: boolean }>>({})
  const [loading, setLoading] = useState(true)

  // Filters
  const [niches,      setNiches]      = useState<string[]>([])
  const [durations,   setDurations]   = useState<string[]>([])
  const [timeframe,   setTimeframe]   = useState<number | null>(null)
  const [storytelling,setStorytelling]= useState<boolean | null>(null)
  const [sortBy,      setSortBy]      = useState('latest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    Promise.all([api.reels('personal'), api.allTags()])
      .then(([data, tags]) => { setReels(data); setTagMap(tags); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const activeFilterCount = niches.length + durations.length +
    (timeframe !== null ? 1 : 0) + (storytelling !== null ? 1 : 0)
  const hasActiveState = activeFilterCount > 0 || sortBy !== 'latest'

  const filtered = useMemo(() => {
    let result = reels.filter(r => {
      const { views, saves, shares, reach, engRate } = reelMetrics(r)
      const tag = tagMap[r.id]
      const isStorytelling = tag?.storytelling ?? false
      const niche = tag?.category ?? r.category ?? 'Untagged'

      // Niche filter
      if (niches.length > 0) {
        const matchNiche  = niches.filter(n => n !== 'Storytelling').includes(niche)
        const matchStory  = niches.includes('Storytelling') && isStorytelling
        const matchUntagged = niches.includes('Untagged') && niche === 'Untagged'
        if (!matchNiche && !matchStory && !matchUntagged) return false
      }

      // Duration filter
      if (durations.length > 0 && !durations.includes(durBucket(r.duration))) return false

      // Timeframe filter
      if (timeframe && r.posted_at) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - timeframe)
        if (new Date(r.posted_at) < cutoff) return false
      }

      // Storytelling filter (standalone toggle, separate from niche multiselect)
      if (storytelling !== null && isStorytelling !== storytelling) return false

      return true
    })

    return result.sort((a, b) => {
      const ma = reelMetrics(a), mb = reelMetrics(b)
      if (sortBy === 'views')    return mb.views   - ma.views
      if (sortBy === 'saves')    return mb.saves   - ma.saves
      if (sortBy === 'shares')   return mb.shares  - ma.shares
      if (sortBy === 'reach')    return mb.reach   - ma.reach
      if (sortBy === 'engRate')  return mb.engRate - ma.engRate
      if (sortBy === 'latest')   return new Date(b.posted_at ?? 0).getTime() - new Date(a.posted_at ?? 0).getTime()
      if (sortBy === 'oldest')   return new Date(a.posted_at ?? 0).getTime() - new Date(b.posted_at ?? 0).getTime()
      if (sortBy === 'longest')  return (b.duration ?? 0) - (a.duration ?? 0)
      if (sortBy === 'shortest') return (a.duration ?? 0) - (b.duration ?? 0)
      return 0
    })
  }, [reels, tagMap, niches, durations, timeframe, storytelling, sortBy])

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Reels <span>Library</span></div>
        <div className="topbar-right">
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              border: showFilters || activeFilterCount > 0 ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
              background: showFilters || activeFilterCount > 0 ? 'var(--accent-glow)' : 'transparent',
              color: showFilters || activeFilterCount > 0 ? 'var(--accent-soft)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filter & Sort'}
          </button>
          {hasActiveState && (
            <button
              onClick={() => { setNiches([]); setDurations([]); setTimeframe(null); setStorytelling(null); setSortBy('latest') }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          )}
          <div className="live-badge">
            <div className="live-dot" />
            {filtered.length} of {reels.length} reels
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div style={{
          borderBottom: '1px solid var(--border-soft)',
          padding: '16px 40px',
          background: 'var(--bg-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'fadeUp 0.2s ease both',
        }}>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', minWidth: 70 }}>
              Sort
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SORT_OPTIONS.map(o => (
                <Chip key={o.key} label={o.label} active={sortBy === o.key} onClick={() => setSortBy(o.key)} />
              ))}
            </div>
          </div>

          {/* Niche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', minWidth: 70 }}>
              Niche
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NICHES.map(n => (
                <Chip key={n} label={n} active={niches.includes(n)} onClick={() => setNiches(toggle(niches, n))} />
              ))}
            </div>
          </div>

          {/* Duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', minWidth: 70 }}>
              Duration
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DURATIONS.map(d => (
                <Chip key={d.key} label={d.label} active={durations.includes(d.key)} onClick={() => setDurations(toggle(durations, d.key))} />
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', minWidth: 70 }}>
              Posted
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TIMEFRAMES.map(t => (
                <Chip key={t.days} label={t.label} active={timeframe === t.days} onClick={() => setTimeframe(timeframe === t.days ? null : t.days)} />
              ))}
            </div>
          </div>

          {/* Storytelling toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', minWidth: 70 }}>
              Format
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Chip label="Storytelling only"    active={storytelling === true}  onClick={() => setStorytelling(storytelling === true  ? null : true)}  />
              <Chip label="No storytelling tag"  active={storytelling === false} onClick={() => setStorytelling(storytelling === false ? null : false)} />
            </div>
          </div>

        </div>
      )}

      <div className="main">
        {loading ? (
          <div className="state-empty">LOADING REELS<br />→ fetching from backend</div>
        ) : filtered.length === 0 ? (
          <div className="state-empty">NO REELS MATCH<br />→ <button onClick={() => { setNiches([]); setDurations([]); setTimeframe(null); setStorytelling(null) }} style={{ background: 'none', border: 'none', color: 'var(--accent-soft)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}>clear filters</button></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {filtered.map((reel) => {
              const { views, engRate, saves } = reelMetrics(reel)
              const tag = tagMap[reel.id]
              const isStorytelling = tag?.storytelling ?? false
              const displayCategory = tag?.category ?? reel.category

              return (
                <Link
                  key={reel.id}
                  href={`/reels/${reel.id}`}
                  className="panel reel-card"
                  style={{ cursor: 'pointer', padding: 12, textDecoration: 'none', display: 'block', animation: 'fadeUp 0.4s ease both', minWidth: 0 }}
                >
                  {/* Video */}
                  <div style={{ position: 'relative', aspectRatio: '9/16', borderRadius: 4, marginBottom: 14, overflow: 'hidden', background: 'linear-gradient(160deg, #1a0a10, #2d0d18)', border: '1px solid var(--accent-border)' }}>
                    <div className="reel-overlay">
                      {reel.posted_at && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                          {fmtDate(reel.posted_at)}
                        </div>
                      )}
                    </div>
                    {isStorytelling && (
                      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.6)', color: 'var(--accent-soft)', padding: '3px 6px', borderRadius: 3, border: '1px solid var(--accent-border)' }}>
                        Story
                      </div>
                    )}
                    {reel.video_url ? (
                      <video
                        src={`${process.env.NEXT_PUBLIC_API_URL}${reel.video_url}`}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        muted loop playsInline preload="metadata"
                        onMouseEnter={e => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}) }}
                        onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-script)', fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>reel</span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {reel.hook_text || reel.caption || reel.id}
                  </div>

                  {/* Meta */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                    {displayCategory ?? '—'}{reel.posted_at ? ` · ${fmtDate(reel.posted_at)}` : ''}
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[['Views', fmtViews(views)], ['Eng', `${engRate.toFixed(1)}%`], ['Saves', saves]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
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
