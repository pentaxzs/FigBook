import { MetricCard } from './MetricCard'
import type { Metric, Product, Feature } from '@/types'

interface MetricListProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }

export function MetricList({ metrics, products, features, onEdit, onTogglePin, onDelete }: MetricListProps) {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))

  const sorted = [...metrics].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">아직 지표가 없어요</p>
        <p className="text-xs mt-1">+ 지표추가 버튼으로 첫 지표를 기록해보세요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(metric => (
        <MetricCard
          key={metric.id}
          metric={metric}
          product={productMap[metric.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
          feature={featureMap[metric.feature_id] ?? UNKNOWN_FEATURE}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
