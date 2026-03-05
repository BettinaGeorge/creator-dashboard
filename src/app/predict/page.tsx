'use client'

import { useState } from 'react'
import { api, fmtViews, PredictResult } from '@/lib/api'

const PAUSED = true // ML model trained on synthetic data — needs real Graph API metrics

const NICHES = ['Motivation', 'Tech', 'Travel', 'Fitness', 'Food', 'Fashion', 'Comedy', 'Lifestyle', 'Beauty', 'Education', 'Finance']
const MUSIC_TYPES = ['Trending', 'Viral Track', 'Remix', 'Original']

export default function PredictPage() {
  const [form, setForm] = useState({
    duration_sec: '',
    hook_strength: '7',
    niche: 'Lifestyle',
    music_type: 'Trending',
    is_weekend: '0',
  })
  const [result, setResult] = useState<PredictResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const runPrediction = async () => {
    if (!form.duration_sec) { setError('Enter a duration.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await api.predict({
        duration_sec:        parseFloat(form.duration_sec),
        hook_strength_score: parseFloat(form.hook_strength) / 10,
        niche:               form.niche,
        music_type:          form.music_type,
        is_weekend:          parseInt(form.is_weekend),
      })
      setResult(res)
    } catch {
      setError('Prediction failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const viralityPct = result ? Math.round(result.virality_probability * 100) : 0

  if (PAUSED) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title" style={{ opacity: 0.4 }}>ML <span>Predictor</span></div>
          <div className="topbar-right">
            <div className="live-badge" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)', opacity: 0.5 }}>
              <div className="live-dot" style={{ background: 'var(--text-muted)' }} />
              Paused
            </div>
          </div>
        </div>
        <div className="main">
          <div style={{
            maxWidth: 480,
            margin: '60px auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{ fontSize: 32, opacity: 0.25 }}>◎</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', color: 'var(--text-primary)', opacity: 0.5 }}>
              Predictor paused
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8, letterSpacing: '0.04em' }}>
              The ML model was trained on a synthetic dataset of 400 reels.
              Until real per-reel metrics are available via the Instagram Graph API,
              predictions wouldn't be meaningful for your actual content.
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>
              Will reactivate when Graph API is connected
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">ML <span>Predictor</span></div>
        <div className="topbar-right">
          <div className="live-badge" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
            <div className="live-dot" style={{ background: '#f59e0b' }} />
            Baseline model · proof of concept
          </div>
        </div>
      </div>

      <div className="main">
        <div className="page-grid-2" style={{ maxWidth: 900 }}>

          {/* Input form */}
          <div className="panel" style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Reel Parameters</div>
                <div className="panel-label">Input metadata to predict</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="form-field">
                <label className="form-label">Duration (seconds)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 15"
                  value={form.duration_sec}
                  onChange={e => handleChange('duration_sec', e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  Hook Strength — {form.hook_strength}/10
                </label>
                <input
                  type="range"
                  min="1" max="10" step="1"
                  value={form.hook_strength}
                  onChange={e => handleChange('hook_strength', e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>
                  <span>weak</span><span>strong</span>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Content Niche</label>
                <select
                  className="form-select"
                  value={form.niche}
                  onChange={e => handleChange('niche', e.target.value)}
                >
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Audio / Music Type</label>
                <select
                  className="form-select"
                  value={form.music_type}
                  onChange={e => handleChange('music_type', e.target.value)}
                >
                  {MUSIC_TYPES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Posting Time</label>
                <select
                  className="form-select"
                  value={form.is_weekend}
                  onChange={e => handleChange('is_weekend', e.target.value)}
                >
                  <option value="0">Weekday</option>
                  <option value="1">Weekend</option>
                </select>
              </div>

              {error && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-soft)', letterSpacing: '0.1em' }}>
                  {error}
                </div>
              )}

              <button
                className="predict-btn"
                onClick={runPrediction}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Running...' : 'Run Prediction'}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                  <line x1="1" y1="6" x2="11" y2="6" />
                  <polyline points="7,2 11,6 7,10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="panel" style={{ animation: 'fadeUp 0.4s ease both 0.15s' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">Prediction Results</div>
                <div className="panel-label">Directional estimate — not a precise forecast</div>
              </div>
            </div>

            {!result ? (
              <div className="state-empty">
                AWAITING INPUT<br />
                → fill parameters<br />
                → run prediction
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Metric cards */}
                <div className="page-grid-2" style={{ gap: 12 }}>
                  {[
                    ['Est. Views (baseline)', fmtViews(Math.round(result.predicted_views))],
                    ['Performance', result.performance_category],
                    ['Virality Score', `${viralityPct}%`],
                    ['Duration Signal', parseInt(form.duration_sec) < 15 ? '✓ Ideal' : '↓ Shorter'],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 4,
                      padding: 16,
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                        {label}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--accent-soft)' }}>
                        {val}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Virality bar */}
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                    Virality Probability
                  </div>
                  <div style={{ height: 4, background: 'var(--border-soft)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${viralityPct}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-soft))',
                      borderRadius: 2,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{
                  padding: 14,
                  background: 'var(--accent-glow)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 4,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--accent-soft)', marginBottom: 6 }}>
                    Model Insight
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {result.recommendation}
                  </div>
                </div>

                {/* Model context */}
                <div style={{
                  padding: 14,
                  background: 'transparent',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 4,
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    About this model
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    Trained on 400 rows of public viral content data using RandomForest regression.
                    Signals used: duration, hook strength, niche, audio type, posting day.
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#6b3a3a', lineHeight: 1.8, marginTop: 6 }}>
                    Not modelled: account size, engagement velocity, hashtag reach, algorithm push, content quality.
                    Treat output as a directional signal — accuracy improves as real creator data accumulates.
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
