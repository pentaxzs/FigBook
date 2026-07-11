import { MetricList } from '@/components/metrics/MetricList'
import type { Metric, Product, Feature } from '@/types'

interface AllViewProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function AllView({ metrics, products, features, onEdit, onTogglePin, onDelete }: AllViewProps) {
  return (
    <MetricList
      metrics={metrics}
      products={products}
      features={features}
      onEdit={onEdit}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
    />
  )
}
