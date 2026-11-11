export type ApiKind = 'REST' | 'GraphQL'

export interface Launch {
  id: string
  name: string
  date: string
  status: 'upcoming' | 'success' | 'failed' | 'unknown'
  rocket: string
  customer: string
  image: string | null
  details: string | null
  webcast: string | null
}

export interface ApiMetrics {
  kind: ApiKind
  latency: number
  payload: number
  timestamp: string
  status: 'success' | 'error'
}

export interface ApiResult<T> {
  data: T
  metrics: ApiMetrics
}

export interface ApiState<T> {
  data: T | null
  metrics: ApiMetrics | null
  loading: boolean
  error: string | null
}
