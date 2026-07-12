import { StorageManager } from '@/lib/storage/StorageManager'
import type { StorageService } from '@/lib/storage/StorageService'
import type { Product } from '@/types'

const mockProduct: Product = {
  id: 'p1', user_id: 'u1', name: 'Test', order: 0, created_at: '2026-01-01T00:00:00Z',
}

function makeMockAdapter(overrides: Partial<StorageService> = {}): StorageService {
  return {
    getProducts: jest.fn().mockResolvedValue([]),
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
    ...overrides,
  }
}

describe('StorageManager', () => {
  it('starts with LocalStorageAdapter (returns empty arrays)', async () => {
    const manager = new StorageManager()
    expect(await manager.getProducts()).toEqual([])
    expect(await manager.getMetrics()).toEqual([])
  })

  it('delegates getProducts to the active adapter', async () => {
    const manager = new StorageManager()
    const mock = makeMockAdapter({
      getProducts: jest.fn().mockResolvedValue([mockProduct]),
    })
    manager.setAdapter(mock)
    const result = await manager.getProducts()
    expect(mock.getProducts).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockProduct])
  })

  it('setAdapter swaps adapter — subsequent calls use new adapter', async () => {
    const manager = new StorageManager()
    const mockA = makeMockAdapter({ getProducts: jest.fn().mockResolvedValue([]) })
    const mockB = makeMockAdapter({ getProducts: jest.fn().mockResolvedValue([mockProduct]) })

    manager.setAdapter(mockA)
    await manager.getProducts()
    expect(mockA.getProducts).toHaveBeenCalledTimes(1)

    manager.setAdapter(mockB)
    const result = await manager.getProducts()
    expect(mockB.getProducts).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockProduct])
  })

  it('delegates saveMetric to the active adapter', async () => {
    const manager = new StorageManager()
    const mock = makeMockAdapter()
    manager.setAdapter(mock)
    const metric = {
      id: 'm1', user_id: 'u1', product_id: 'p1', feature_id: 'f1',
      name: 'MAU', value: '100', unit: '명', category: [], memo: '',
      base_date: '2026-01', is_pinned: false, created_at: '2026-01-01T00:00:00Z',
    }
    await manager.saveMetric(metric)
    expect(mock.saveMetric).toHaveBeenCalledWith(metric)
  })
})
