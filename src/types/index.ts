export interface Product {
  id: string           // UUID v4
  user_id: string      // 예약 (Supabase Auth 대비), 현재는 'local'
  name: string
  order: number
  created_at: string   // ISO 8601
}

export interface Metric {
  id: string
  user_id: string
  product_id: string
  name: string
  value: string
  unit: string
  category: string[]
  memo: string
  base_date: string    // "YYYY-MM" 형식
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
  direction: QuizDirection
}
