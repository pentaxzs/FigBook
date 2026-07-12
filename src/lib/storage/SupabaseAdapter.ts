import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageService } from './StorageService'
import { LocalStorageAdapter } from './LocalStorageAdapter'
import type { Product, Feature, Metric, Settings } from '@/types'

export class SupabaseAdapter implements StorageService {
  private local = new LocalStorageAdapter()

  constructor(
    private supabase: SupabaseClient,
    private userId: string,
  ) {}

  // ── Products ──────────────────────────────────────────────────────────────

  async getProducts(): Promise<Product[]> {
    const { data } = await this.supabase
      .from('products')
      .select('*')
      .order('order', { ascending: true })
    return (data ?? []) as Product[]
  }

  async saveProduct(product: Product): Promise<void> {
    await this.supabase
      .from('products')
      .insert({ ...product, user_id: this.userId })
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await this.supabase.from('products').update(data).eq('id', id)
  }

  async deleteProduct(id: string): Promise<void> {
    await this.supabase.from('products').delete().eq('id', id)
  }

  // ── Features ──────────────────────────────────────────────────────────────

  async getFeatures(productId?: string): Promise<Feature[]> {
    let query = this.supabase
      .from('features')
      .select('*')
      .order('order', { ascending: true })
    if (productId) query = query.eq('product_id', productId) as typeof query
    const { data } = await query
    return (data ?? []) as Feature[]
  }

  async saveFeature(feature: Feature): Promise<void> {
    await this.supabase
      .from('features')
      .insert({ ...feature, user_id: this.userId })
  }

  async updateFeature(id: string, data: Partial<Feature>): Promise<void> {
    await this.supabase.from('features').update(data).eq('id', id)
  }

  async deleteFeature(id: string): Promise<void> {
    await this.supabase.from('features').delete().eq('id', id)
  }

  // ── Metrics ───────────────────────────────────────────────────────────────

  async getMetrics(productId?: string): Promise<Metric[]> {
    let query = this.supabase
      .from('metrics')
      .select('*')
      .order('created_at', { ascending: false })
    if (productId) query = query.eq('product_id', productId) as typeof query
    const { data } = await query
    return ((data ?? []) as (Metric & { feature_id: string | null })[]).map(row => ({
      ...row,
      feature_id: row.feature_id ?? '',  // on delete set null → fallback to ''
    }))
  }

  async saveMetric(metric: Metric): Promise<void> {
    await this.supabase
      .from('metrics')
      .insert({ ...metric, user_id: this.userId })
  }

  async updateMetric(id: string, data: Partial<Metric>): Promise<void> {
    await this.supabase.from('metrics').update(data).eq('id', id)
  }

  async deleteMetric(id: string): Promise<void> {
    await this.supabase.from('metrics').delete().eq('id', id)
  }

  // ── Settings + Recent Searches — stay in localStorage ─────────────────────

  getSettings(): Promise<Settings> { return this.local.getSettings() }
  saveSettings(data: Partial<Settings>): Promise<void> { return this.local.saveSettings(data) }
  getRecentSearches(): Promise<string[]> { return this.local.getRecentSearches() }
  saveRecentSearch(query: string): Promise<void> { return this.local.saveRecentSearch(query) }
  clearRecentSearches(): Promise<void> { return this.local.clearRecentSearches() }
}
