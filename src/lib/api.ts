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
  insights: ReelInsight[]
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
  summary:       (source?: string) =>
    fetcher<Summary>(`/analytics/summary${source ? `?source=${source}` : ''}`),

  topPerforming: (limit = 5, source?: string) =>
    fetcher<TopReel[]>(`/analytics/top-performing?limit=${limit}${source ? `&source=${source}` : ''}`),

  categories:    () => fetcher<Category[]>('/analytics/categories'),

  audioTypes:    () => fetcher<AudioType[]>('/analytics/audio-types'),

  growth:        (source?: string) =>
    fetcher<GrowthPoint[]>(`/analytics/growth${source ? `?source=${source}` : ''}`),

  topHooks:      () => fetcher<TopHooks>('/analytics/top-performing-hooks'),

  reels:         (source?: string) =>
    fetcher<Reel[]>(`/reels${source ? `?source=${source}` : ''}`),

  reel:          (id: string) => fetcher<Reel>(`/reels/${id}`),

  predict:       (data: PredictInput) =>
    fetcher<PredictResult>('/predict/', { method: 'POST', body: JSON.stringify(data) }),
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
