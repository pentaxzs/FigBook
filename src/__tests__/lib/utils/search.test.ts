import { filterMetrics } from '@/lib/utils/search'
import type { Metric } from '@/types'

const metrics: Metric[] = [
  {
    id: '1', user_id: 'local', product_id: 'p1', feature_id: 'f1',
    name: 'MAU', value: '15만', unit: '명',
    category: ['retention'], memo: 'Q1 기준',
    base_date: '2025-03', is_pinned: false, created_at: '',
  },
  {
    id: '2', user_id: 'local', product_id: 'p2', feature_id: 'f2',
    name: '클릭률', value: '3.2', unit: '%',
    category: ['engagement'], memo: '',
    base_date: '2025-02', is_pinned: false, created_at: '',
  },
]

describe('filterMetrics', () => {
  it('빈 쿼리는 전체 반환', () => {
    expect(filterMetrics(metrics, '')).toHaveLength(2)
  })

  it('지표명으로 검색', () => {
    expect(filterMetrics(metrics, 'MAU')).toHaveLength(1)
    expect(filterMetrics(metrics, 'MAU')[0].id).toBe('1')
  })

  it('메모로 검색', () => {
    expect(filterMetrics(metrics, 'Q1')).toHaveLength(1)
  })

  it('카테고리로 검색', () => {
    expect(filterMetrics(metrics, 'engagement')).toHaveLength(1)
    expect(filterMetrics(metrics, 'engagement')[0].id).toBe('2')
  })

  it('대소문자 무시', () => {
    expect(filterMetrics(metrics, 'mau')).toHaveLength(1)
  })
})
