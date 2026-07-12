import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import { migrateLocalToSupabase } from '@/lib/storage/migration'
import type { StorageService } from '@/lib/storage/StorageService'
import type { Product } from '@/types'

const MIGRATION_KEY = 'figbook_migrated'

const mockProduct: Product = {
  id: 'p1', user_id: 'old-user', name: 'App', order: 0, created_at: '2026-01-01T00:00:00Z',
}

function makeRemote(products: Product[] = []): StorageService {
  return {
    getProducts: jest.fn().mockResolvedValue(products),
    saveProduct: jest.fn().mockResolvedValue(undefined),
    updateProduct: jest.fn().mockResolvedValue(undefined),
    deleteProduct: jest.fn().mockResolvedValue(undefined),
    getFeatures: jest.fn().mockResolvedValue([]),
    saveFeature: jest.fn().mockResolvedValue(undefined),
    updateFeature: jest.fn().mockResolvedValue(undefined),
    deleteFeature: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockResolvedValue([]),
    saveMetric: jest.fn().mockResolvedValue(undefined),
    updateMetric: jest.fn().mockResolvedValue(undefined),
    deleteMetric: jest.fn().mockResolvedValue(undefined),
    getSettings: jest.fn().mockResolvedValue({ ai_provider: 'openai', api_keys: {} }),
    saveSettings: jest.fn().mockResolvedValue(undefined),
    getRecentSearches: jest.fn().mockResolvedValue([]),
    saveRecentSearch: jest.fn().mockResolvedValue(undefined),
    clearRecentSearches: jest.fn().mockResolvedValue(undefined),
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('migrateLocalToSupabase', () => {
  it('skips if figbook_migrated flag is set', async () => {
    localStorage.setItem(MIGRATION_KEY, 'true')
    const remote = makeRemote()
    await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
    expect(remote.getProducts).not.toHaveBeenCalled()
  })

  it('skips and sets flag if Supabase already has products', async () => {
    const remote = makeRemote([mockProduct])
    await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
    expect(remote.saveProduct).not.toHaveBeenCalled()
    expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
  })

  it('migrates local products/features/metrics to Supabase', async () => {
    const local = new LocalStorageAdapter()
    await local.saveProduct(mockProduct)

    const remote = makeRemote([])  // empty Supabase
    await migrateLocalToSupabase(local, remote)

    expect(remote.saveProduct).toHaveBeenCalledWith(mockProduct)
    expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
  })

  it('sets flag even when local storage is empty', async () => {
    const remote = makeRemote([])
    await migrateLocalToSupabase(new LocalStorageAdapter(), remote)
    expect(remote.saveProduct).not.toHaveBeenCalled()
    expect(localStorage.getItem(MIGRATION_KEY)).toBe('true')
  })

  it('does not throw if migration fails — sets no flag', async () => {
    const local = new LocalStorageAdapter()
    await local.saveProduct(mockProduct)

    const remote = makeRemote([])
    ;(remote.getProducts as jest.Mock).mockRejectedValueOnce(new Error('network'))

    await expect(migrateLocalToSupabase(local, remote)).resolves.not.toThrow()
    expect(localStorage.getItem(MIGRATION_KEY)).toBeNull()
  })
})
