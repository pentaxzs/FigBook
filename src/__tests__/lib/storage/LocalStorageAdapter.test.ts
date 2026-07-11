import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import type { Product, Metric } from '@/types'

const mockProduct: Product = {
  id: 'prod-1',
  user_id: 'local',
  name: '카드앱',
  order: 0,
  created_at: '2026-01-01T00:00:00.000Z',
}

const mockMetric: Metric = {
  id: 'metric-1',
  user_id: 'local',
  product_id: 'prod-1',
  name: 'MAU',
  value: '15만',
  unit: '명',
  category: ['retention'],
  memo: '',
  base_date: '2025-03',
  is_pinned: false,
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
  })

  it('빈 상태에서 products는 빈 배열을 반환한다', async () => {
    const products = await adapter.getProducts()
    expect(products).toEqual([])
  })

  it('product를 저장하고 조회할 수 있다', async () => {
    await adapter.saveProduct(mockProduct)
    const products = await adapter.getProducts()
    expect(products).toHaveLength(1)
    expect(products[0]).toEqual(mockProduct)
  })

  it('product를 업데이트할 수 있다', async () => {
    await adapter.saveProduct(mockProduct)
    await adapter.updateProduct('prod-1', { name: '카드웹' })
    const products = await adapter.getProducts()
    expect(products[0].name).toBe('카드웹')
  })

  it('product를 삭제할 수 있다', async () => {
    await adapter.saveProduct(mockProduct)
    await adapter.deleteProduct('prod-1')
    const products = await adapter.getProducts()
    expect(products).toHaveLength(0)
  })

  it('metric을 저장하고 조회할 수 있다', async () => {
    await adapter.saveMetric(mockMetric)
    const metrics = await adapter.getMetrics()
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toEqual(mockMetric)
  })

  it('productId로 metric을 필터링할 수 있다', async () => {
    const otherMetric = { ...mockMetric, id: 'metric-2', product_id: 'prod-2' }
    await adapter.saveMetric(mockMetric)
    await adapter.saveMetric(otherMetric)
    const metrics = await adapter.getMetrics('prod-1')
    expect(metrics).toHaveLength(1)
    expect(metrics[0].id).toBe('metric-1')
  })

  it('metric is_pinned을 업데이트할 수 있다', async () => {
    await adapter.saveMetric(mockMetric)
    await adapter.updateMetric('metric-1', { is_pinned: true })
    const metrics = await adapter.getMetrics()
    expect(metrics[0].is_pinned).toBe(true)
  })

  it('기본 settings를 반환한다', async () => {
    const settings = await adapter.getSettings()
    expect(settings.ai_provider).toBe('openai')
    expect(settings.api_keys).toEqual({})
  })

  it('settings를 저장하고 조회할 수 있다', async () => {
    await adapter.saveSettings({ ai_provider: 'gemini', api_keys: { gemini: 'test-key' } })
    const settings = await adapter.getSettings()
    expect(settings.ai_provider).toBe('gemini')
    expect(settings.api_keys.gemini).toBe('test-key')
  })
})
