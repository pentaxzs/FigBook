'use client'

import { useState } from 'react'
import { ProductSubTabs } from '@/components/products/ProductSubTabs'
import { MetricList } from '@/components/metrics/MetricList'
import type { Metric, Product } from '@/types'

interface ByProductViewProps {
  metrics: Metric[]
  products: Product[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
}

export function ByProductView({
  metrics, products, onEdit, onTogglePin, onDelete,
  onAddProduct, onEditProduct, onDeleteProduct,
}: ByProductViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null)

  const filtered = selectedId
    ? metrics.filter(m => m.product_id === selectedId)
    : metrics

  return (
    <div>
      <ProductSubTabs
        products={products}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={onAddProduct}
        onEdit={onEditProduct}
        onDelete={onDeleteProduct}
      />
      <div className="mt-4">
        <MetricList
          metrics={filtered}
          products={products}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
