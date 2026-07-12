import { MetricList } from '@/components/metrics/MetricList'
import type { Metric, Product, Feature } from '@/types'

type ViewMode = 'list' | 'grid'

interface AllViewProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  view: ViewMode
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function AllView({ metrics, products, features, view, onEdit, onTogglePin, onDelete }: AllViewProps) {
  return (
    <MetricList
      metrics={metrics}
      products={products}
      features={features}
      view={view}
      onEdit={onEdit}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
    />
  )
}
