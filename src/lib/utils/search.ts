import type { Metric, Feature } from '@/types'

export function filterMetrics(metrics: Metric[], query: string, features?: Feature[]): Metric[] {
  if (!query.trim()) return metrics
  const q = query.toLowerCase()
  return metrics.filter(m => {
    const feature = features?.find(f => f.id === m.feature_id)
    return (
      m.name.toLowerCase().includes(q) ||
      m.value.toLowerCase().includes(q) ||
      m.unit.toLowerCase().includes(q) ||
      m.memo.toLowerCase().includes(q) ||
      m.category.some(c => c.toLowerCase().includes(q)) ||
      (feature?.name.toLowerCase().includes(q) ?? false)
    )
  })
}
