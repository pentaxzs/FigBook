import type { Product, Feature, Metric, Settings } from '@/types'

export interface StorageService {
  // Products
  getProducts(): Promise<Product[]>
  saveProduct(product: Product): Promise<void>
  updateProduct(id: string, data: Partial<Product>): Promise<void>
  deleteProduct(id: string): Promise<void>

  // Features
  getFeatures(productId?: string): Promise<Feature[]>
  saveFeature(feature: Feature): Promise<void>
  updateFeature(id: string, data: Partial<Feature>): Promise<void>
  deleteFeature(id: string): Promise<void>

  // Metrics
  getMetrics(productId?: string): Promise<Metric[]>
  saveMetric(metric: Metric): Promise<void>
  updateMetric(id: string, data: Partial<Metric>): Promise<void>
  deleteMetric(id: string): Promise<void>

  // Settings
  getSettings(): Promise<Settings>
  saveSettings(settings: Partial<Settings>): Promise<void>

  // Recent Searches
  getRecentSearches(): Promise<string[]>
  saveRecentSearch(query: string): Promise<void>
  clearRecentSearches(): Promise<void>
}
