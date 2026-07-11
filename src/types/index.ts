export interface Product {
  id: string
  user_id: string
  name: string
  order: number
  created_at: string
}

export interface Feature {
  id: string
  user_id: string
  product_id: string
  name: string
  order: number
  created_at: string
}

export interface Metric {
  id: string
  user_id: string
  product_id: string
  feature_id: string   // NEW — required
  name: string
  value: string
  unit: string
  category: string[]
  memo: string
  base_date: string
  is_pinned: boolean
  created_at: string
}

export interface Settings {
  ai_provider: 'gemini' | 'openai' | 'anthropic'
  api_keys: {
    gemini?: string
    openai?: string
    anthropic?: string
  }
}

export interface ParsedMetric {
  name: string | null
  value: string | null
  unit: string | null
  base_date: string | null
}

export type QuizDirection = 'name-to-value' | 'value-to-name'

export interface QuizQuestion {
  metric: Metric
  product: Product
  feature: Feature
  direction: QuizDirection
}
