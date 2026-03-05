const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Summary {
  total_reels: number
  total_views: number
  total_saves: number
  avg_views: number
  avg_reach: number
  avg_engagement: number
  avg_engagement_rate: number
  avg_saves: number
  avg_shares: number
}

export interface TopReel {
  reel_id: string
  hook_text: string | null
  category: string | null
  audio_type: string | null
  video_views: number
  engagement: number
}

export interface Category {
  category: string
  avg_views: number
  avg_engagement: number
  avg_saves: number
  reel_count: number
}

export interface AudioType {
  audio_type: string
  avg_views: number
  avg_engagement: number
  reel_count: number
}

export interface GrowthPoint {
  reel_id: string
  posted_at: string
  hook_text: string | null
  video_views: number
  engagement: number
  saves: number
  shares: number
}

export interface ReelInsight {
  id: number
  reel_id: string
  impressions: number | null
  reach: number | null
  engagement: number | null
  saves: number | null
  shares: number | null
  video_views: number | null
  snapshot_time: string | null
}

export interface Reel {
  id: string
  caption: string | null
  hook_text: string | null
  duration: number | null
  category: string | null
  audio_type: string | null
  posted_at: string | null
  created_at: string | null
  source: string | null
  video_url: string | null
  insights: ReelInsight[]
}

export const CATEGORIES = ['Fitness', 'Beauty', 'Lifestyle', 'Fashion', 'Faith', 'Travel'] as const
export type CategoryName = typeof CATEGORIES[number]

export interface ReelTag {
  reel_id:      string
  category:     CategoryName | null
  storytelling: boolean
}

export interface PredictInput {
  duration_sec: number
  hook_strength_score: number
  niche: string
  music_type: string
  is_weekend: number
}

export interface PredictResult {
  predicted_views: number
  performance_category: string
  virality_probability: number
  recommendation: string
}

export interface TopHooks {
  top_niches: Record<string, number>
  top_audio_types: Record<string, number>
  best_hook_strength_ranges: Record<string, number>
}

// ── API functions ──────────────────────────────────────────────────────────

export const api = {
  summary:       (source?: string, fromDate?: string) => {
    const p = new URLSearchParams()
    if (source)   p.set('source', source)
    if (fromDate) p.set('from_date', fromDate)
    const q = p.toString()
    return fetcher<Summary>(`/analytics/summary${q ? `?${q}` : ''}`)
  },

  topPerforming: (limit = 5, source?: string) =>
    fetcher<TopReel[]>(`/analytics/top-performing?limit=${limit}${source ? `&source=${source}` : ''}`),

  categories:    (source?: string) =>
    fetcher<Category[]>(`/analytics/categories${source ? `?source=${source}` : ''}`),

  audioTypes:    (source?: string) =>
    fetcher<AudioType[]>(`/analytics/audio-types${source ? `?source=${source}` : ''}`),

  growth:        (source?: string, fromDate?: string) => {
    const p = new URLSearchParams()
    if (source)   p.set('source', source)
    if (fromDate) p.set('from_date', fromDate)
    const q = p.toString()
    return fetcher<GrowthPoint[]>(`/analytics/growth${q ? `?${q}` : ''}`)
  },

  topHooks:      () => fetcher<TopHooks>('/analytics/top-performing-hooks'),

  reels:         (source?: string) =>
    fetcher<Reel[]>(`/reels${source ? `?source=${source}` : ''}`),

  reel:          (id: string) => fetcher<Reel>(`/reels/${id}`),

  predict:       (data: PredictInput) =>
    fetcher<PredictResult>('/predict/', { method: 'POST', body: JSON.stringify(data) }),

  allTags: () =>
    fetcher<Record<string, { category: string | null; storytelling: boolean }>>('/reel-tags'),

  getTags: (reelId: string) =>
    fetcher<ReelTag>(`/reels/${reelId}/tags`),

  setTags: (reelId: string, data: { category: CategoryName | null; storytelling: boolean }) =>
    fetcher<ReelTag>(`/reels/${reelId}/tags`, { method: 'PUT', body: JSON.stringify(data) }),

  ai: {
    hooks:    (niche: string, angle: string, planner_context = '') =>
      fetcher<{ result: string }>('/ai/hooks', { method: 'POST', body: JSON.stringify({ niche, angle, planner_context }) }),
    brief:    (niche: string, idea: string, planner_context = '') =>
      fetcher<{ result: string }>('/ai/brief', { method: 'POST', body: JSON.stringify({ niche, idea, planner_context }) }),
    strategy: (planner_context = '') =>
      fetcher<{ result: string }>('/ai/strategy', { method: 'POST', body: JSON.stringify({ planner_context }) }),
    series:   (concept: string, episode_count: number, planner_context = '') =>
      fetcher<{ result: string }>('/ai/series', { method: 'POST', body: JSON.stringify({ concept, episode_count, planner_context }) }),
    trends:   (niche: string, planner_context = '') =>
      fetcher<{ result: string }>('/ai/trends', { method: 'POST', body: JSON.stringify({ niche, planner_context }) }),
  },
}

// ── Planner context serialiser ───────────────────────────────────────────────

function loadLS<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export function getPlannerContext(): string {
  const content  = loadLS<any>('planner_content')
  const deals    = loadLS<any>('planner_deals')
  const series   = loadLS<any>('planner_series')

  const lines: string[] = ['## Content Planner Context\n']

  // Upcoming scheduled content — next 30 days, not yet posted
  const now   = new Date()
  const in30  = new Date(now.getTime() + 30 * 86_400_000)
  const upcoming = content
    .filter((c: any) => c.status !== 'posted' && c.scheduledDate)
    .filter((c: any) => { const d = new Date(c.scheduledDate); return d >= now && d <= in30 })
    .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate))

  if (upcoming.length > 0) {
    lines.push('**Upcoming content (next 30 days):**')
    upcoming.forEach((c: any) => {
      const date = new Date(c.scheduledDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const hook = c.hook ? ` — hook: "${c.hook}"` : ''
      const s    = c.series ? ` [${c.series}]` : ''
      lines.push(`- [${date}]${s} "${c.title}" · ${c.type} · ${c.status}${hook}`)
    })
    lines.push('')
  }

  // Active brand deals
  const activeDeals = deals.filter((d: any) => !['paid', 'delivered'].includes(d.status))
  if (activeDeals.length > 0) {
    lines.push('**Active brand deals:**')
    activeDeals.forEach((d: any) => {
      const deadline = new Date(d.deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      lines.push(`- ${d.brand}: ${d.deliverable} — due ${deadline} · ${d.status.replace('_', ' ')}`)
    })
    lines.push('')
  }

  // Active series
  const activeSeries = series.filter((s: any) => s.status === 'active')
  if (activeSeries.length > 0) {
    lines.push('**Active series:**')
    activeSeries.forEach((s: any) => {
      lines.push(`- "${s.name}" (${s.episodeCount} eps) — ${s.theme}`)
    })
    lines.push('')
  }

  const hasData = upcoming.length > 0 || activeDeals.length > 0 || activeSeries.length > 0
  return hasData ? lines.join('\n') : ''
}

// ── Formatters ──────────────────────────────────────────────────────────────

export function fmtViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}
