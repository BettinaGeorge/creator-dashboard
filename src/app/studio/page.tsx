'use client'

import { useState, useEffect } from 'react'
import { api, CATEGORIES, fmtViews, GrowthPoint } from '@/lib/api'

type Tool = 'hooks' | 'brief' | 'strategy' | 'series' | 'trends'

const TOOLS: { id: Tool; label: string; description: string }[] = [
  { id: 'hooks',    label: 'Hook Lab',          description: '5 hook variations for any angle' },
  { id: 'brief',    label: 'Content Brief',      description: 'Full reel brief in seconds' },
  { id: 'strategy', label: 'Strategy Advisor',   description: 'AI read of your real data' },
  { id: 'series',   label: 'Series Planner',     description: 'Build your storytelling pillar' },
  { id: 'trends',   label: 'Trend Scout',        description: 'What\'s working in your niches' },
]

function ResultPanel({ text }: { text: string }) {
  return (
    <div style={{
      marginTop: 20,
      padding: '20px 24px',
      background: 'var(--bg-2)',
      border: '1px solid var(--accent-border)',
      borderRadius: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--text-secondary)',
      lineHeight: 1.8,
      whiteSpace: 'pre-wrap',
      animation: 'fadeUp 0.3s ease both',
    }}>
      {text}
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{
      marginTop: 20,
      padding: '20px 24px',
      background: 'var(--bg-2)',
      border: '1px solid var(--border-soft)',
      borderRadius: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
    }}>
      → generating...
    </div>
  )
}

function inputStyle(disabled = false) {
  return {
    width: '100%',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    padding: '10px 14px',
    background: 'var(--bg)',
    border: '1px solid var(--border-soft)',
    borderRadius: 4,
    color: 'var(--text-primary)',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    boxSizing: 'border-box' as const,
  }
}

function RunButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        padding: '10px 24px',
        background: loading ? 'var(--accent-glow)' : 'var(--accent)',
        border: '1px solid var(--accent)',
        borderRadius: 4,
        color: loading ? 'var(--text-muted)' : 'var(--bg)',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        marginTop: 12,
      }}
    >
      {loading ? 'Generating...' : 'Generate →'}
    </button>
  )
}

// ── Tools ────────────────────────────────────────────────────────────────────

function HookLab() {
  const [niche, setNiche]   = useState(CATEGORIES[0])
  const [angle, setAngle]   = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!angle.trim()) return
    setLoading(true); setResult('')
    try {
      const r = await api.ai.hooks(niche, angle)
      setResult(r.result)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Give me a niche and a content angle — I'll write 5 hook variations and explain why each works.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Niche</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setNiche(c)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 14px', borderRadius: 20,
                border: niche === c ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                background: niche === c ? 'var(--accent-glow)' : 'transparent',
                color: niche === c ? 'var(--accent-soft)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Content angle</div>
          <input
            style={inputStyle()}
            placeholder="e.g. I never used to work out consistently until this..."
            value={angle}
            onChange={e => setAngle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
          />
        </div>
      </div>

      <RunButton loading={loading} onClick={run} />
      {loading && <LoadingDots />}
      {result && !loading && <ResultPanel text={result} />}
    </div>
  )
}

function ContentBrief() {
  const [niche, setNiche]   = useState(CATEGORIES[0])
  const [idea, setIdea]     = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!idea.trim()) return
    setLoading(true); setResult('')
    try {
      const r = await api.ai.brief(niche, idea)
      setResult(r.result)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Describe your reel idea — I'll give you a full brief: hook, 3-act structure, CTA, and caption starter.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Niche</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[...CATEGORIES, 'Storytelling'].map(c => (
              <button key={c} onClick={() => setNiche(c)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 14px', borderRadius: 20,
                border: niche === c ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                background: niche === c ? 'var(--accent-glow)' : 'transparent',
                color: niche === c ? 'var(--accent-soft)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Reel idea</div>
          <textarea
            rows={3}
            style={{ ...inputStyle(), resize: 'none' }}
            placeholder="e.g. My 6am morning routine as a pre-med student who actually loves fitness"
            value={idea}
            onChange={e => setIdea(e.target.value)}
          />
        </div>
      </div>

      <RunButton loading={loading} onClick={run} />
      {loading && <LoadingDots />}
      {result && !loading && <ResultPanel text={result} />}
    </div>
  )
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function bestPostingDay(growth: GrowthPoint[]) {
  const byDay: Record<number, { total: number; count: number }> = {}
  growth.forEach(pt => {
    if (!pt.posted_at) return
    const d = new Date(pt.posted_at).getDay()
    if (!byDay[d]) byDay[d] = { total: 0, count: 0 }
    byDay[d].total += pt.video_views
    byDay[d].count++
  })
  return DOW.map((name, i) => ({
    name,
    avg: byDay[i] ? Math.round(byDay[i].total / byDay[i].count) : 0,
    count: byDay[i]?.count ?? 0,
  }))
}

function StrategyAdvisor() {
  const [result, setResult]   = useState('')
  const [loading, setLoading] = useState(false)
  const [growth, setGrowth]   = useState<GrowthPoint[]>([])

  useEffect(() => {
    api.growth('personal').then(setGrowth).catch(() => {})
  }, [])

  const run = async () => {
    setLoading(true); setResult('')
    try {
      const r = await api.ai.strategy()
      setResult(r.result)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const dayData = bestPostingDay(growth)
  const maxDayAvg = Math.max(...dayData.map(d => d.avg), 1)
  const bestDay = dayData.reduce((best, d) => d.avg > best.avg ? d : best, dayData[0])

  return (
    <div>
      <div style={{ marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Pulls your real analytics — views, saves, categories, posting patterns — and gives you a sharp,
        honest strategy read. What's working, what isn't, and one thing to do this week.
      </div>

      {/* Best Posting Day chart */}
      {growth.length > 0 && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--bg-2)', border: '1px solid var(--border-soft)', borderRadius: 6 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Best Posting Day — {bestDay?.avg > 0 ? `${bestDay.name} leads with ${fmtViews(bestDay.avg)} avg views` : 'not enough data'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, alignItems: 'end', height: 72 }}>
            {dayData.map(d => (
              <div key={d.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text-muted)' }}>
                  {d.avg > 0 ? fmtViews(d.avg) : ''}
                </div>
                <div style={{
                  width: '100%',
                  height: `${Math.max(4, (d.avg / maxDayAvg) * 44)}px`,
                  background: d.name === bestDay?.name && d.avg > 0
                    ? 'linear-gradient(180deg, var(--accent-soft), var(--accent))'
                    : 'var(--border)',
                  borderRadius: '2px 2px 0 0',
                  opacity: d.count === 0 ? 0.2 : 0.85,
                }} />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em',
                  color: d.name === bestDay?.name && d.avg > 0 ? 'var(--accent-soft)' : 'var(--text-muted)',
                }}>
                  {d.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RunButton loading={loading} onClick={run} />
      {loading && <LoadingDots />}
      {result && !loading && <ResultPanel text={result} />}
    </div>
  )
}

function SeriesPlanner() {
  const [concept, setConcept]   = useState('')
  const [episodes, setEpisodes] = useState(5)
  const [result, setResult]     = useState('')
  const [loading, setLoading]   = useState(false)

  const run = async () => {
    if (!concept.trim()) return
    setLoading(true); setResult('')
    try {
      const r = await api.ai.series(concept, episodes)
      setResult(r.result)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Describe a series concept and I'll plan it out: title, episode arc, hooks, and cliffhangers.
        Built for your Storytelling pillar.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Series concept</div>
          <textarea
            rows={3}
            style={{ ...inputStyle(), resize: 'none' }}
            placeholder="e.g. Documenting my journey from hating the gym to becoming a morning workout person"
            value={concept}
            onChange={e => setConcept(e.target.value)}
          />
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Number of episodes</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[3, 4, 5, 6, 8].map(n => (
              <button key={n} onClick={() => setEpisodes(n)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 14px', borderRadius: 20,
                border: episodes === n ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
                background: episodes === n ? 'var(--accent-glow)' : 'transparent',
                color: episodes === n ? 'var(--accent-soft)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <RunButton loading={loading} onClick={run} />
      {loading && <LoadingDots />}
      {result && !loading && <ResultPanel text={result} />}
    </div>
  )
}

function TrendScout() {
  const [niche, setNiche]   = useState(CATEGORIES[0])
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true); setResult('')
    try {
      const r = await api.ai.trends(niche)
      setResult(r.result)
    } catch (e: any) {
      setResult(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Surfaces trending content formats, hook styles, and angles in your niche — plus one underused
        opportunity specific to your background.
        <br />
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
          Note: based on knowledge up to mid-2025. Flag anything that feels outdated.
        </span>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Niche</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[...CATEGORIES, 'Storytelling'].map(c => (
            <button key={c} onClick={() => setNiche(c)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, padding: '6px 14px', borderRadius: 20,
              border: niche === c ? '1px solid var(--accent)' : '1px solid var(--border-soft)',
              background: niche === c ? 'var(--accent-glow)' : 'transparent',
              color: niche === c ? 'var(--accent-soft)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      <RunButton loading={loading} onClick={run} />
      {loading && <LoadingDots />}
      {result && !loading && <ResultPanel text={result} />}
    </div>
  )
}

const TOOL_COMPONENTS: Record<Tool, React.ReactNode> = {
  hooks:    <HookLab />,
  brief:    <ContentBrief />,
  strategy: <StrategyAdvisor />,
  series:   <SeriesPlanner />,
  trends:   <TrendScout />,
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [active, setActive] = useState<Tool>('hooks')

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">AI <span>Studio</span></div>
        <div className="topbar-right">
          <div className="live-badge">
            <div className="live-dot" style={{ background: 'var(--accent-soft)' }} />
            Claude-powered
          </div>
        </div>
      </div>

      <div className="main">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Tool selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 3,
                  padding: '12px 16px',
                  background: active === t.id ? 'var(--accent-glow)' : 'transparent',
                  border: active === t.id ? '1px solid var(--accent-border)' : '1px solid transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: active === t.id ? 'var(--accent-soft)' : 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}>
                  {t.description}
                </div>
              </button>
            ))}
          </div>

          {/* Active tool */}
          <div className="panel" style={{ animation: 'fadeUp 0.3s ease both' }}>
            <div className="panel-header" style={{ marginBottom: 20 }}>
              <div>
                <div className="panel-title">
                  {TOOLS.find(t => t.id === active)?.label}
                </div>
                <div className="panel-label">
                  {TOOLS.find(t => t.id === active)?.description}
                </div>
              </div>
            </div>
            {TOOL_COMPONENTS[active]}
          </div>

        </div>
      </div>
    </>
  )
}
