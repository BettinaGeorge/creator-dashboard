'use client'

/**
 * Planner page — content calendar, brand deals, series tracker, batch sessions.
 *
 * All data lives in localStorage (no backend).
 * Why localStorage here and not a database?
 *   - This is personal operational data (your schedule, your deals).
 *     It changes constantly and doesn't need to be shared or analysed.
 *   - Keeps the backend clean for analytics data that actually powers insights.
 *   - Instant CRUD with no API round-trips.
 *
 * Data is stored under four keys:
 *   planner_content   — scheduled posts/reels
 *   planner_deals     — brand deal pipeline
 *   planner_series    — recurring series you're running
 *   planner_sessions  — batch filming/editing sessions
 */

import { useEffect, useReducer, useState, useCallback } from 'react'
import { useTheme } from '@/components/ThemeProvider'

// ── Types ──────────────────────────────────────────────────────────────

type ContentStatus = 'idea' | 'filming' | 'editing' | 'scheduled' | 'posted'
type DealStatus    = 'negotiating' | 'confirmed' | 'in_progress' | 'delivered' | 'paid'
type SeriesStatus  = 'active' | 'paused' | 'completed'
type SessionType   = 'filming' | 'editing' | 'brainstorm'

interface ContentItem {
  id: string
  title: string
  type: 'reel' | 'post' | 'story'
  scheduledDate: string
  status: ContentStatus
  series?: string
  hook?: string
  notes?: string
}

interface BrandDeal {
  id: string
  brand: string
  deliverable: string
  deadline: string
  status: DealStatus
  fee?: string
  notes?: string
}

interface Series {
  id: string
  name: string
  theme: string
  status: SeriesStatus
  episodeCount: number
}

interface BatchSession {
  id: string
  date: string
  type: SessionType
  notes?: string
}

// ── localStorage helpers ───────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function save<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const uid = () => Math.random().toString(36).slice(2, 10)

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function seedSampleData(
  setContent: (fn: (p: ContentItem[]) => ContentItem[]) => void,
  setDeals:   (fn: (p: BrandDeal[]) => BrandDeal[]) => void,
  setSeries:  (fn: (p: Series[]) => Series[]) => void,
  setSessions:(fn: (p: BatchSession[]) => BatchSession[]) => void,
) {
  const content: ContentItem[] = [
    { id: uid(), title: 'Protein-packed breakfast I eat every day', type: 'reel', scheduledDate: daysFromNow(1),  status: 'filming',   hook: 'I used to skip breakfast until I tried this...', notes: 'Film in kitchen, morning light' },
    { id: uid(), title: 'My honest skincare routine (before + after)', type: 'reel', scheduledDate: daysFromNow(3),  status: 'editing',   hook: 'Three months of this and my skin changed',       notes: 'Close-up shots, bathroom lighting' },
    { id: uid(), title: 'OOTD: Lagos-inspired college fits',           type: 'reel', scheduledDate: daysFromNow(6),  status: 'idea',      notes: 'Afrocentric prints + modern cut. Find a good wall.' },
    { id: uid(), title: 'What my faith looks like as a student',       type: 'reel', scheduledDate: daysFromNow(9),  status: 'idea',      hook: "It doesn't look like what you think", series: 'Lagos to London' },
    { id: uid(), title: 'How I study + stay consistent with the gym',  type: 'reel', scheduledDate: daysFromNow(13), status: 'idea',      notes: 'Day-in-the-life format' },
    { id: uid(), title: 'Nigerian student budget meals (under £5)',     type: 'reel', scheduledDate: daysFromNow(15), status: 'idea',      hook: 'Jollof rice in the UK hit different', notes: 'Film at home, show ingredients' },
    { id: uid(), title: 'Answering your questions about studying abroad', type: 'reel', scheduledDate: daysFromNow(20), status: 'scheduled', series: 'Lagos to London', hook: "You've been asking, I'm finally answering" },
    { id: uid(), title: 'End of month gym progress check-in',          type: 'reel', scheduledDate: daysFromNow(23), status: 'idea' },
  ]
  const deals: BrandDeal[] = [
    { id: uid(), brand: 'Gymshark',     deliverable: '1 workout reel + 2 story frames', deadline: daysFromNow(10), status: 'in_progress', fee: '£400', notes: 'Use code BETTINA10. No competitors for 30 days after post.' },
    { id: uid(), brand: 'Fenty Beauty', deliverable: '1 skincare reel',                 deadline: daysFromNow(17), status: 'confirmed',   fee: '£300', notes: 'Showcase Hydra Vizor SPF. Gifted products incoming.' },
    { id: uid(), brand: 'ASOS',         deliverable: '3 OOTDs + stories',               deadline: daysFromNow(31), status: 'negotiating',              notes: 'Awaiting contract. Chase usage rights before signing.' },
  ]
  const series: Series[] = [
    { id: uid(), name: 'Lagos to London',  theme: 'My journey as a Nigerian student — culture, growth, identity', status: 'active',    episodeCount: 3 },
    { id: uid(), name: 'Gym Diaries',      theme: 'Monthly fitness progress and honest updates',                  status: 'active',    episodeCount: 5 },
    { id: uid(), name: 'Glow Up Journal',  theme: 'Skincare + beauty evolution over 90 days',                    status: 'paused',    episodeCount: 2 },
  ]
  const sessions: BatchSession[] = [
    { id: uid(), date: daysFromNow(2),  type: 'filming',    notes: 'Breakfast reel + skincare B-roll' },
    { id: uid(), date: daysFromNow(4),  type: 'editing',    notes: 'Skincare reel cut + Gymshark integration' },
    { id: uid(), date: daysFromNow(8),  type: 'brainstorm', notes: 'Q2 content direction, series ideas, ASOS brief review' },
    { id: uid(), date: daysFromNow(16), type: 'filming',    notes: 'Budget meals + OOTD batch (3 looks)' },
  ]
  setContent(() => content)
  setDeals(() => deals)
  setSeries(() => series)
  setSessions(() => sessions)
}

// ── Status colours ─────────────────────────────────────────────────────

const CONTENT_COLOUR_DARK: Record<ContentStatus, string> = {
  idea:      '#5c1818',
  filming:   '#4a3800',
  editing:   '#0a2550',
  scheduled: '#0a3518',
  posted:    '#1a3a08',
}
const CONTENT_COLOUR_LIGHT: Record<ContentStatus, string> = {
  idea:      '#ffd5d5',
  filming:   '#fff0b0',
  editing:   '#d0e8ff',
  scheduled: '#c8f5e0',
  posted:    '#e0f5c0',
}
const CONTENT_TEXT_DARK: Record<ContentStatus, string> = {
  idea:      '#ff9090',
  filming:   '#ffd040',
  editing:   '#60b0ff',
  scheduled: '#30d870',
  posted:    '#80e030',
}
const CONTENT_TEXT_LIGHT: Record<ContentStatus, string> = {
  idea:      '#8b0000',
  filming:   '#7a4800',
  editing:   '#003580',
  scheduled: '#005028',
  posted:    '#2a5800',
}
const dealColour: Record<DealStatus, string> = {
  negotiating: '#4a3535',
  confirmed:   '#2a4a5a',
  in_progress: '#5a4a20',
  delivered:   '#2a4a3a',
  paid:        '#3a4a2a',
}
const dealText: Record<DealStatus, string> = {
  negotiating: '#9a7070',
  confirmed:   '#4090c0',
  in_progress: '#c0a040',
  delivered:   '#40c080',
  paid:        '#80c040',
}

// ── Shared modal overlay ───────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

// ── Tab navigation ─────────────────────────────────────────────────────

const TABS = ['Calendar', 'Brand Deals', 'Series', 'Batch Schedule'] as const
type Tab = typeof TABS[number]

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function PlannerPage() {
  const [tab, setTab]           = useState<Tab>('Calendar')
  const [content, setContent]   = useState<ContentItem[]>([])
  const [deals, setDeals]       = useState<BrandDeal[]>([])
  const [series, setSeries]     = useState<Series[]>([])
  const [sessions, setSessions] = useState<BatchSession[]>([])
  const [sampleLoaded, setSampleLoaded] = useState(false)

  // Load from localStorage once on mount
  useEffect(() => {
    setContent(load('planner_content', []))
    setDeals(load('planner_deals', []))
    setSeries(load('planner_series', []))
    setSessions(load('planner_sessions', []))
  }, [])

  // Persist on every change
  useEffect(() => { save('planner_content', content) },   [content])
  useEffect(() => { save('planner_deals', deals) },       [deals])
  useEffect(() => { save('planner_series', series) },     [series])
  useEffect(() => { save('planner_sessions', sessions) }, [sessions])

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">Content <span>Planner</span></div>
        <div className="topbar-right">
          <div className="topbar-date">
            {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
          {sampleLoaded ? (
            <button
              onClick={() => {
                setContent(() => [])
                setDeals(() => [])
                setSeries(() => [])
                setSessions(() => [])
                setSampleLoaded(false)
              }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '5px 12px',
                background: 'transparent', border: '1px solid var(--border-soft)',
                color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer',
              }}
            >
              ← Return to real data
            </button>
          ) : (content.length === 0 && deals.length === 0) && (
            <button
              onClick={() => { seedSampleData(setContent, setDeals, setSeries, setSessions); setSampleLoaded(true) }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '5px 12px',
                background: 'transparent', border: '1px solid var(--border-soft)',
                color: 'var(--text-muted)', borderRadius: 3, cursor: 'pointer',
              }}
            >
              Load sample data
            </button>
          )}
          <div className="live-badge">
            <div className="live-dot" />
            {content.length} scheduled
          </div>
        </div>
      </div>

      <div className="main" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-soft)', paddingBottom: 0, flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '8px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: t === tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: t === tab ? 'var(--accent-soft)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Calendar'      && <CalendarTab content={content} series={series} setContent={setContent} />}
        {tab === 'Brand Deals'   && <DealsTab deals={deals} setDeals={setDeals} />}
        {tab === 'Series'        && <SeriesTab series={series} setSeries={setSeries} />}
        {tab === 'Batch Schedule'&& <SessionsTab sessions={sessions} setSessions={setSessions} />}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB: CALENDAR
// ══════════════════════════════════════════════════════════════════════

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarTab({
  content, series, setContent
}: {
  content: ContentItem[]
  series: Series[]
  setContent: (fn: (prev: ContentItem[]) => ContentItem[]) => void
}) {
  const { theme } = useTheme()
  const contentColour = theme === 'dark' ? CONTENT_COLOUR_DARK : CONTENT_COLOUR_LIGHT
  const contentText   = theme === 'dark' ? CONTENT_TEXT_DARK   : CONTENT_TEXT_LIGHT

  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())   // 0-indexed
  const [editing,   setEditing]   = useState<ContentItem | null>(null)
  const [showForm,  setShowForm]  = useState(false)

  // ── Calendar maths ─────────────────────────────────────────────────
  // firstDayOffset: how many blank cells before the 1st of the month
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Total cells must be a multiple of 7
  const totalCells     = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // ── CRUD ───────────────────────────────────────────────────────────
  const blankFor = (dateStr: string): ContentItem => ({
    id: uid(), title: '', type: 'reel', scheduledDate: dateStr, status: 'idea',
  })

  const saveItem = (item: ContentItem) => {
    setContent(prev =>
      prev.find(c => c.id === item.id)
        ? prev.map(c => c.id === item.id ? item : c)
        : [...prev, item]
    )
    setEditing(null); setShowForm(false)
  }

  const removeItem = (id: string) => {
    if (!window.confirm('Delete this item?')) return
    setContent(prev => prev.filter(c => c.id !== id))
  }

  // ── Helpers ────────────────────────────────────────────────────────
  const isoFor = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${viewYear}-${mm}-${dd}`
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const itemsOnDay = (day: number) =>
    content.filter(c => c.scheduledDate === isoFor(day))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* ── Month navigation ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={prevMonth} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, width: 28, height: 28, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic', color: 'var(--text-primary)', minWidth: 160, textAlign: 'center' }}>
            {new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, width: 28, height: 28, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
        <button className="panel-action" onClick={() => { setEditing(blankFor(today.toISOString().slice(0, 10))); setShowForm(true) }}>
          + Add content
        </button>
      </div>

      {/* ── Day-of-week header ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 2, marginBottom: 2, flexShrink: 0 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: '1fr', gap: 2, flex: 1, minHeight: 0 }}>
        {Array.from({ length: totalCells }).map((_, i) => {
          const day = i - firstDayOffset + 1
          const inMonth = day >= 1 && day <= daysInMonth
          const items   = inMonth ? itemsOnDay(day) : []

          return (
            <div
              key={i}
              onClick={() => {
                if (!inMonth) return
                setEditing(blankFor(isoFor(day)))
                setShowForm(true)
              }}
              style={{
                background: inMonth ? 'var(--bg-card)' : 'transparent',
                border: inMonth
                  ? isToday(day)
                    ? '1px solid var(--accent-border)'
                    : '1px solid var(--border-soft)'
                  : '1px solid transparent',
                borderRadius: 4,
                padding: '6px 8px',
                cursor: inMonth ? 'pointer' : 'default',
                transition: 'background 0.15s',
                position: 'relative',
                overflow: 'hidden',
                minWidth: 0,
              }}
              onMouseEnter={e => { if (inMonth) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)' }}
              onMouseLeave={e => { if (inMonth) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)' }}
            >
              {inMonth && (
                <>
                  {/* Day number */}
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: isToday(day) ? 'var(--accent-soft)' : 'var(--text-muted)',
                    fontWeight: isToday(day) ? 600 : 400,
                    marginBottom: 4,
                  }}>
                    {day}
                    {isToday(day) && (
                      <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginLeft: 4, verticalAlign: 'middle' }} />
                    )}
                  </div>

                  {/* Content chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        onClick={e => { e.stopPropagation(); setEditing(item); setShowForm(true) }}
                        title={item.title || '(untitled)'}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          padding: '4px 7px',
                          borderRadius: 3,
                          background: contentColour[item.status],
                          color: contentText[item.status],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {item.title || '(untitled)'}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', paddingLeft: 2 }}>
                        +{items.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Edit / create modal ── */}
      {showForm && editing && (
        <Modal onClose={() => { setShowForm(false); setEditing(null) }}>
          <ContentForm
            item={editing}
            series={series}
            onSave={saveItem}
            onDelete={editing.title !== '' ? () => { removeItem(editing.id); setShowForm(false); setEditing(null) } : undefined}
            onClose={() => { setShowForm(false); setEditing(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

function ContentForm({ item, series, onSave, onDelete, onClose }: {
  item: ContentItem; series: Series[]
  onSave: (i: ContentItem) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [v, setV] = useState(item)
  const set = (k: keyof ContentItem, val: string) => setV(p => ({ ...p, [k]: val }))

  return (
    <>
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="panel-title">Schedule Content</div>
          <div className="panel-label">Plan a post, reel, or story</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldRow label="Title / Concept">
          <input className="form-input" value={v.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Morning routine reel" />
        </FieldRow>
        <div className="page-grid-2" style={{ gap: 12 }}>
          <FieldRow label="Type">
            <select className="form-select" value={v.type} onChange={e => set('type', e.target.value as ContentItem['type'])}>
              <option value="reel">Reel</option>
              <option value="post">Post</option>
              <option value="story">Story</option>
            </select>
          </FieldRow>
          <FieldRow label="Status">
            <select className="form-select" value={v.status} onChange={e => set('status', e.target.value as ContentStatus)}>
              <option value="idea">Idea</option>
              <option value="filming">Filming</option>
              <option value="editing">Editing</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
            </select>
          </FieldRow>
        </div>
        <FieldRow label="Scheduled Date">
          <input className="form-input" type="date" value={v.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} />
        </FieldRow>
        {series.length > 0 && (
          <FieldRow label="Series (optional)">
            <select className="form-select" value={v.series || ''} onChange={e => set('series', e.target.value)}>
              <option value="">None</option>
              {series.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </FieldRow>
        )}
        <FieldRow label="Hook idea (optional)">
          <input className="form-input" value={v.hook || ''} onChange={e => set('hook', e.target.value)} placeholder="e.g. This changed everything for me..." />
        </FieldRow>
        <FieldRow label="Notes">
          <textarea className="form-input" rows={3} value={v.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="B-roll ideas, vibe, references..." style={{ resize: 'vertical' }} />
        </FieldRow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onDelete ? (
            <button onClick={onDelete} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, padding: '6px 14px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Delete
            </button>
          ) : <div />}
          <button className="predict-btn" onClick={() => onSave(v)}>Save</button>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB: BRAND DEALS
// ══════════════════════════════════════════════════════════════════════

function DealsTab({ deals, setDeals }: {
  deals: BrandDeal[]
  setDeals: (fn: (prev: BrandDeal[]) => BrandDeal[]) => void
}) {
  const [editing, setEditing] = useState<BrandDeal | null>(null)

  const blank = (): BrandDeal => ({
    id: uid(), brand: '', deliverable: '',
    deadline: new Date().toISOString().slice(0, 10), status: 'negotiating',
  })

  const save = (item: BrandDeal) => {
    setDeals(prev =>
      prev.find(d => d.id === item.id)
        ? prev.map(d => d.id === item.id ? item : d)
        : [...prev, item]
    )
    setEditing(null)
  }

  const remove = (id: string) => {
    if (!window.confirm('Delete this deal?')) return
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const daysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {deals.length} deals in pipeline
        </div>
        <button className="panel-action" onClick={() => setEditing(blank())}>+ Add deal</button>
      </div>

      {deals.length === 0 ? (
        <div className="state-empty">NO DEALS YET<br />→ add a brand partnership</div>
      ) : (
        <div className="page-grid-2">
          {deals.map(deal => {
            const days = daysLeft(deal.deadline)
            return (
              <div key={deal.id} className="panel" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    {deal.brand || 'Brand'}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase',
                    letterSpacing: '0.12em', padding: '3px 9px', borderRadius: 20,
                    background: dealColour[deal.status], color: dealText[deal.status],
                  }}>
                    {deal.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  {deal.deliverable}
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Deadline</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: days < 7 ? '#c06040' : 'var(--text-secondary)' }}>
                      {new Date(deal.deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                        ({days > 0 ? `${days}d left` : days === 0 ? 'today' : `${Math.abs(days)}d ago`})
                      </span>
                    </div>
                  </div>
                  {deal.fee && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Fee</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--accent-soft)' }}>{deal.fee}</div>
                    </div>
                  )}
                </div>

                {deal.notes && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                    {deal.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="panel-action" onClick={() => setEditing(deal)} style={{ padding: '4px 12px', fontSize: 8 }}>Edit</button>
                  <button onClick={() => remove(deal.id)} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, padding: '4px 12px', borderRadius: 2, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <DealForm item={editing} onSave={save} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}

function DealForm({ item, onSave, onClose }: { item: BrandDeal; onSave: (d: BrandDeal) => void; onClose: () => void }) {
  const [v, setV] = useState(item)
  const set = (k: keyof BrandDeal, val: string) => setV(p => ({ ...p, [k]: val }))

  return (
    <>
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="panel-title">Brand Deal</div>
          <div className="panel-label">Track partnership details</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldRow label="Brand name">
          <input className="form-input" value={v.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. ASOS" />
        </FieldRow>
        <FieldRow label="Deliverable">
          <input className="form-input" value={v.deliverable} onChange={e => set('deliverable', e.target.value)} placeholder="e.g. 1 sponsored reel + 3 stories" />
        </FieldRow>
        <div className="page-grid-2" style={{ gap: 12 }}>
          <FieldRow label="Deadline">
            <input className="form-input" type="date" value={v.deadline} onChange={e => set('deadline', e.target.value)} />
          </FieldRow>
          <FieldRow label="Status">
            <select className="form-select" value={v.status} onChange={e => set('status', e.target.value as DealStatus)}>
              <option value="negotiating">Negotiating</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="delivered">Delivered</option>
              <option value="paid">Paid</option>
            </select>
          </FieldRow>
        </div>
        <FieldRow label="Fee (optional)">
          <input className="form-input" value={v.fee || ''} onChange={e => set('fee', e.target.value)} placeholder="e.g. £500" />
        </FieldRow>
        <FieldRow label="Notes">
          <textarea className="form-input" rows={3} value={v.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Usage rights, talking points, dos and don'ts..." style={{ resize: 'vertical' }} />
        </FieldRow>
        <button className="predict-btn" style={{ alignSelf: 'flex-end' }} onClick={() => onSave(v)}>Save</button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB: SERIES
// ══════════════════════════════════════════════════════════════════════

function SeriesTab({ series, setSeries }: {
  series: Series[]
  setSeries: (fn: (prev: Series[]) => Series[]) => void
}) {
  const [editing, setEditing] = useState<Series | null>(null)

  const blank = (): Series => ({ id: uid(), name: '', theme: '', status: 'active', episodeCount: 0 })

  const save = (item: Series) => {
    setSeries(prev =>
      prev.find(s => s.id === item.id)
        ? prev.map(s => s.id === item.id ? item : s)
        : [...prev, item]
    )
    setEditing(null)
  }

  const remove = (id: string) => {
    if (!window.confirm('Delete this series?')) return
    setSeries(prev => prev.filter(s => s.id !== id))
  }

  const statusColor: Record<SeriesStatus, string> = {
    active: '#40c080', paused: '#c0a040', completed: '#4090c0'
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {series.filter(s => s.status === 'active').length} active series
        </div>
        <button className="panel-action" onClick={() => setEditing(blank())}>+ Add series</button>
      </div>

      {series.length === 0 ? (
        <div className="state-empty">NO SERIES YET<br />→ define a recurring content series</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {series.map(s => (
            <div key={s.id} className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: statusColor[s.status], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {s.status}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{s.theme}</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 52 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--accent-soft)' }}>{s.episodeCount}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>eps</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="panel-action" onClick={() => setEditing(s)} style={{ padding: '3px 10px', fontSize: 8 }}>Edit</button>
                <button onClick={() => remove(s.id)} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, padding: '3px 10px', borderRadius: 2, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <SeriesForm item={editing} onSave={save} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}

function SeriesForm({ item, onSave, onClose }: { item: Series; onSave: (s: Series) => void; onClose: () => void }) {
  const [v, setV] = useState(item)
  const set = (k: keyof Series, val: string | number) => setV(p => ({ ...p, [k]: val }))

  return (
    <>
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="panel-title">Series</div>
          <div className="panel-label">Define a recurring content series</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FieldRow label="Series name">
          <input className="form-input" value={v.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Finance for Gen Z" />
        </FieldRow>
        <FieldRow label="Theme / description">
          <input className="form-input" value={v.theme} onChange={e => set('theme', e.target.value)} placeholder="e.g. Weekly tips on budgeting and investing" />
        </FieldRow>
        <div className="page-grid-2" style={{ gap: 12 }}>
          <FieldRow label="Status">
            <select className="form-select" value={v.status} onChange={e => set('status', e.target.value as SeriesStatus)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </FieldRow>
          <FieldRow label="Episodes so far">
            <input className="form-input" type="number" min={0} value={v.episodeCount} onChange={e => set('episodeCount', parseInt(e.target.value) || 0)} />
          </FieldRow>
        </div>
        <button className="predict-btn" style={{ alignSelf: 'flex-end' }} onClick={() => onSave(v)}>Save</button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════
// TAB: BATCH SCHEDULE
// ══════════════════════════════════════════════════════════════════════

function SessionsTab({ sessions, setSessions }: {
  sessions: BatchSession[]
  setSessions: (fn: (prev: BatchSession[]) => BatchSession[]) => void
}) {
  const [editing, setEditing] = useState<BatchSession | null>(null)

  const blank = (): BatchSession => ({
    id: uid(), date: new Date().toISOString().slice(0, 10), type: 'filming',
  })

  const save = (item: BatchSession) => {
    setSessions(prev =>
      prev.find(s => s.id === item.id)
        ? prev.map(s => s.id === item.id ? item : s)
        : [...prev, item]
    )
    setEditing(null)
  }

  const remove = (id: string) => {
    if (!window.confirm('Delete this session?')) return
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const typeColor: Record<SessionType, { bg: string; text: string }> = {
    filming:    { bg: '#2a4a5a', text: '#4090c0' },
    editing:    { bg: '#5a4a20', text: '#c0a040' },
    brainstorm: { bg: '#3a2a5a', text: '#9060c0' },
  }

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {sessions.length} sessions planned
        </div>
        <button className="panel-action" onClick={() => setEditing(blank())}>+ Add session</button>
      </div>

      {sorted.length === 0 ? (
        <div className="state-empty">NO SESSIONS SCHEDULED<br />→ block out filming and editing time</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(session => {
            const col = typeColor[session.type]
            return (
              <div key={session.id} className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Date */}
                <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 44 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {new Date(session.date + 'T12:00:00').getDate()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: 'var(--border-soft)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase',
                    letterSpacing: '0.12em', padding: '3px 9px', borderRadius: 20,
                    background: col.bg, color: col.text, marginBottom: 6, display: 'inline-block',
                  }}>
                    {session.type}
                  </span>
                  {session.notes && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {session.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="panel-action" onClick={() => setEditing(session)} style={{ padding: '3px 10px', fontSize: 8 }}>Edit</button>
                  <button onClick={() => remove(session.id)} style={{ background: 'transparent', border: '1px solid var(--border-soft)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 8, padding: '3px 10px', borderRadius: 2, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <SessionForm item={editing} onSave={save} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}

function SessionForm({ item, onSave, onClose }: { item: BatchSession; onSave: (s: BatchSession) => void; onClose: () => void }) {
  const [v, setV] = useState(item)
  const set = (k: keyof BatchSession, val: string) => setV(p => ({ ...p, [k]: val }))

  return (
    <>
      <div className="panel-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="panel-title">Batch Session</div>
          <div className="panel-label">Block out time for filming or editing</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="page-grid-2" style={{ gap: 12 }}>
          <FieldRow label="Date">
            <input className="form-input" type="date" value={v.date} onChange={e => set('date', e.target.value)} />
          </FieldRow>
          <FieldRow label="Session type">
            <select className="form-select" value={v.type} onChange={e => set('type', e.target.value as SessionType)}>
              <option value="filming">Filming</option>
              <option value="editing">Editing</option>
              <option value="brainstorm">Brainstorm</option>
            </select>
          </FieldRow>
        </div>
        <FieldRow label="Notes">
          <textarea className="form-input" rows={3} value={v.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="What content are you filming? Which reels to edit?" style={{ resize: 'vertical' }} />
        </FieldRow>
        <button className="predict-btn" style={{ alignSelf: 'flex-end' }} onClick={() => onSave(v)}>Save</button>
      </div>
    </>
  )
}
