import type { LocalStorageAdapter } from './LocalStorageAdapter'
import type { StorageService } from './StorageService'

const MIGRATION_KEY = 'figbook_migrated'

export async function migrateLocalToSupabase(
  local: LocalStorageAdapter,
  remote: StorageService,
): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return

  try {
    // Skip if Supabase already has data (e.g. logged in on a second device)
    const existing = await remote.getProducts()
    if (existing.length > 0) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      return
    }

    const [products, features, metrics] = await Promise.all([
      local.getProducts(),
      local.getFeatures(),
      local.getMetrics(),
    ])

    // Nothing to migrate
    if (products.length === 0 && features.length === 0 && metrics.length === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true')
      return
    }

    // Insert sequentially: products → features → metrics (FK order)
    for (const p of products) await remote.saveProduct(p)
    for (const f of features) await remote.saveFeature(f)
    for (const m of metrics) await remote.saveMetric(m)

    localStorage.setItem(MIGRATION_KEY, 'true')
  } catch {
    // Silent failure — localStorage data is untouched, user can retry next login
  }
}
