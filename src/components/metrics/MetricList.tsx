import { MetricCard } from './MetricCard'
import type { Metric, Product } from '@/types'

interface MetricListProps {
  metrics: Metric[]
  products: Product[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function MetricList({ metrics, products, onEdit, onTogglePin, onDelete }: MetricListProps) {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

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
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
