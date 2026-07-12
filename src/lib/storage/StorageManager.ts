import type { StorageService } from './StorageService'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import type { Product, Feature, Metric, Settings } from '@/types'

export class StorageManager implements StorageService {
  private adapter: StorageService = new LocalStorageAdapter()

  setAdapter(adapter: StorageService): void {
    this.adapter = adapter
  }

  getProducts() { return this.adapter.getProducts() }
  saveProduct(p: Product) { return this.adapter.saveProduct(p) }
  updateProduct(id: string, data: Partial<Product>) { return this.adapter.updateProduct(id, data) }
  deleteProduct(id: string) { return this.adapter.deleteProduct(id) }

  getFeatures(productId?: string) { return this.adapter.getFeatures(productId) }
  saveFeature(f: Feature) { return this.adapter.saveFeature(f) }
  updateFeature(id: string, data: Partial<Feature>) { return this.adapter.updateFeature(id, data) }
  deleteFeature(id: string) { return this.adapter.deleteFeature(id) }

  getMetrics(productId?: string) { return this.adapter.getMetrics(productId) }
  saveMetric(m: Metric) { return this.adapter.saveMetric(m) }
  updateMetric(id: string, data: Partial<Metric>) { return this.adapter.updateMetric(id, data) }
  deleteMetric(id: string) { return this.adapter.deleteMetric(id) }

  getSettings() { return this.adapter.getSettings() }
  saveSettings(data: Partial<Settings>) { return this.adapter.saveSettings(data) }

  getRecentSearches() { return this.adapter.getRecentSearches() }
  saveRecentSearch(query: string) { return this.adapter.saveRecentSearch(query) }
  clearRecentSearches() { return this.adapter.clearRecentSearches() }
}
