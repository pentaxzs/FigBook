import { MetricList } from '@/components/metrics/MetricList'
import type { Metric, Product } from '@/types'

interface AllViewProps {
  metrics: Metric[]
  products: Product[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function AllView({ metrics, products, onEdit, onTogglePin, onDelete }: AllViewProps) {
  return (
    <MetricList
      metrics={metrics}
      products={products}
      onEdit={onEdit}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
    />
  )
}
