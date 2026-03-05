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
    hooks:    (niche: string, angle: string) =>
      fetcher<{ result: string }>('/ai/hooks', { method: 'POST', body: JSON.stringify({ niche, angle }) }),
    brief:    (niche: string, idea: string) =>
      fetcher<{ result: string }>('/ai/brief', { method: 'POST', body: JSON.stringify({ niche, idea }) }),
    strategy: () =>
      fetcher<{ result: string }>('/ai/strategy', { method: 'POST' }),
    series:   (concept: string, episode_count: number) =>
      fetcher<{ result: string }>('/ai/series', { method: 'POST', body: JSON.stringify({ concept, episode_count }) }),
    trends:   (niche: string) =>
      fetcher<{ result: string }>('/ai/trends', { method: 'POST', body: JSON.stringify({ niche }) }),
  },
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
