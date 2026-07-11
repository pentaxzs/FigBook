import type { Product, Feature, Metric, Settings } from '@/types'
import type { StorageService } from './StorageService'

const KEYS = {
  products: 'metricspad_products',
  features: 'metricspad_features',
  metrics: 'metricspad_metrics',
  settings: 'metricspad_settings',
} as const

const RECENT_KEY = 'metricspad_recent_searches'

const DEFAULT_SETTINGS: Settings = {
  ai_provider: 'openai',
  api_keys: {},
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export class LocalStorageAdapter implements StorageService {
  async getProducts(): Promise<Product[]> {
    return read<Product[]>(KEYS.products, [])
  }

  async saveProduct(product: Product): Promise<void> {
    const products = await this.getProducts()
    write(KEYS.products, [...products, product])
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    const products = await this.getProducts()
    write(KEYS.products, products.map(p => p.id === id ? { ...p, ...data } : p))
  }

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts()
    write(KEYS.products, products.filter(p => p.id !== id))
  }

  async getFeatures(productId?: string): Promise<Feature[]> {
    const features = read<Feature[]>(KEYS.features, [])
    return productId ? features.filter(f => f.product_id === productId) : features
  }

  async saveFeature(feature: Feature): Promise<void> {
    const features = await this.getFeatures()
    write(KEYS.features, [...features, feature])
  }

  async updateFeature(id: string, data: Partial<Feature>): Promise<void> {
    const features = await this.getFeatures()
    write(KEYS.features, features.map(f => f.id === id ? { ...f, ...data } : f))
  }

  async deleteFeature(id: string): Promise<void> {
    const features = await this.getFeatures()
    write(KEYS.features, features.filter(f => f.id !== id))
  }

  async getMetrics(productId?: string): Promise<Metric[]> {
    const metrics = read<Metric[]>(KEYS.metrics, [])
    return productId ? metrics.filter(m => m.product_id === productId) : metrics
  }

  async saveMetric(metric: Metric): Promise<void> {
    const metrics = await this.getMetrics()
    write(KEYS.metrics, [...metrics, metric])
  }

  async updateMetric(id: string, data: Partial<Metric>): Promise<void> {
    const metrics = await this.getMetrics()
    write(KEYS.metrics, metrics.map(m => m.id === id ? { ...m, ...data } : m))
  }

  async deleteMetric(id: string): Promise<void> {
    const metrics = await this.getMetrics()
    write(KEYS.metrics, metrics.filter(m => m.id !== id))
  }

  async getSettings(): Promise<Settings> {
    return read<Settings>(KEYS.settings, DEFAULT_SETTINGS)
  }

  async saveSettings(data: Partial<Settings>): Promise<void> {
    const current = await this.getSettings()
    write(KEYS.settings, { ...current, ...data })
  }

  async getRecentSearches(): Promise<string[]> {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch {
      return []
    }
  }

  async saveRecentSearch(query: string): Promise<void> {
    const recent = await this.getRecentSearches()
    const updated = [query, ...recent.filter(r => r !== query)].slice(0, 8)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  }

  async clearRecentSearches(): Promise<void> {
    localStorage.removeItem(RECENT_KEY)
  }
}

// 싱글톤 인스턴스 (앱 전체에서 재사용)
export const storage = new LocalStorageAdapter()
