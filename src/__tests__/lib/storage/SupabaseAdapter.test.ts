import { SupabaseAdapter } from '@/lib/storage/SupabaseAdapter'
import type { Product, Feature, Metric } from '@/types'

const userId = 'user-123'

const mockProduct: Product = {
  id: 'p1', user_id: userId, name: 'TestApp', order: 0, created_at: '2026-01-01T00:00:00Z',
}
const mockFeature: Feature = {
  id: 'f1', user_id: userId, product_id: 'p1', name: 'Auth', order: 0, created_at: '2026-01-01T00:00:00Z',
}
const mockMetric: Metric = {
  id: 'm1', user_id: userId, product_id: 'p1', feature_id: 'f1',
  name: 'MAU', value: '100', unit: '명', category: ['retention'],
  memo: '', base_date: '2026-01', is_pinned: false, created_at: '2026-01-01T00:00:00Z',
}

function makeChain(resolveValue: unknown) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'single']
  methods.forEach(m => {
    chain[m] = jest.fn(() => chain)
  })
  // Terminal — actual resolved value
  Object.defineProperty(chain, 'then', {
    get() {
      return (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve)
    },
  })
  return chain
}

function makeSupabaseClient(resolveValue: unknown = { data: [], error: null }) {
  const chain = makeChain(resolveValue)
  return { from: jest.fn(() => chain), _chain: chain }
}

describe('SupabaseAdapter', () => {
  describe('getProducts', () => {
    it('returns products from Supabase', async () => {
      const { _chain, ...client } = makeSupabaseClient({ data: [mockProduct], error: null })
      const adapter = new SupabaseAdapter(client as never, userId)
      const result = await adapter.getProducts()
      expect(client.from).toHaveBeenCalledWith('products')
      expect(result).toEqual([mockProduct])
    })

    it('returns [] when data is null', async () => {
      const { _chain, ...client } = makeSupabaseClient({ data: null, error: null })
      const adapter = new SupabaseAdapter(client as never, userId)
      expect(await adapter.getProducts()).toEqual([])
    })
  })

  describe('saveProduct', () => {
    it('inserts product with correct user_id', async () => {
      const { _chain, ...client } = makeSupabaseClient({ error: null })
      const adapter = new SupabaseAdapter(client as never, userId)
      await adapter.saveProduct(mockProduct)
      expect(client.from).toHaveBeenCalledWith('products')
      expect(_chain.insert).toHaveBeenCalledWith({ ...mockProduct, user_id: userId })
    })
  })

  describe('getMetrics', () => {
    it('maps null feature_id to empty string', async () => {
      const row = { ...mockMetric, feature_id: null }
      const { _chain, ...client } = makeSupabaseClient({ data: [row], error: null })
      const adapter = new SupabaseAdapter(client as never, userId)
      const result = await adapter.getMetrics()
      expect(result[0].feature_id).toBe('')
    })
  })

  describe('settings and recent searches', () => {
    it('getSettings delegates to localStorage', async () => {
      const { _chain, ...client } = makeSupabaseClient({ data: [], error: null })
      const adapter = new SupabaseAdapter(client as never, userId)
      const settings = await adapter.getSettings()
      expect(settings).toHaveProperty('ai_provider')
    })
  })
})
