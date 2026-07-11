import type { Metric } from '@/types'

export function filterMetrics(metrics: Metric[], query: string): Metric[] {
  if (!query.trim()) return metrics
  const q = query.toLowerCase()
  return metrics.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.value.toLowerCase().includes(q) ||
    m.unit.toLowerCase().includes(q) ||
    m.memo.toLowerCase().includes(q) ||
    m.category.some(c => c.toLowerCase().includes(q))
  )
}
