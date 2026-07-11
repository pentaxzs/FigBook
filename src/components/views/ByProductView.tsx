'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ProductSubTabs } from '@/components/products/ProductSubTabs'
import { MetricCard } from '@/components/metrics/MetricCard'
import type { Metric, Product, Feature } from '@/types'

interface ByProductViewProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
}

const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }

export function ByProductView({
  metrics, products, features, onEdit, onTogglePin, onDelete,
  onAddProduct, onEditProduct, onDeleteProduct,
}: ByProductViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(products[0]?.id ?? null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))

  // Metrics filtered by selected product
  const productMetrics = selectedId
    ? metrics.filter(m => m.product_id === selectedId)
    : metrics

  // Features for selected product, sorted by order
  const productFeatures = (selectedId
    ? features.filter(f => f.product_id === selectedId)
    : []
  ).sort((a, b) => a.order - b.order)

  const toggleCollapse = (featureId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(featureId)) {
        next.delete(featureId)
      } else {
        next.add(featureId)
      }
      return next
    })
  }

  const sortMetrics = (ms: Metric[]) =>
    [...ms].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

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
        {productFeatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
            <p className="text-sm">아직 영역/기능이 없어요.</p>
            <p className="text-xs mt-1">지표를 추가할 때 영역/기능도 함께 만들 수 있어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {productFeatures.map(feature => {
              const featureMetrics = sortMetrics(
                productMetrics.filter(m => m.feature_id === feature.id)
              )
              const isCollapsed = collapsed.has(feature.id)

              return (
                <div key={feature.id}>
                  <button
                    onClick={() => toggleCollapse(feature.id)}
                    className="flex items-center justify-between py-3 px-0 w-full cursor-pointer border-b border-border"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-foreground">{feature.name}</span>
                      <span className="text-xs bg-muted text-secondary rounded-full px-2 py-0.5 ml-2">
                        {featureMetrics.length}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={16} className="text-gray-400" />
                      : <ChevronUp size={16} className="text-gray-400" />
                    }
                  </button>
                  {!isCollapsed && featureMetrics.length > 0 && (
                    <div className="flex flex-col gap-3 pt-3 pb-2">
                      {featureMetrics.map(m => (
                        <MetricCard
                          key={m.id}
                          metric={m}
                          product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                          feature={featureMap[m.feature_id] ?? UNKNOWN_FEATURE}
                          onEdit={onEdit}
                          onTogglePin={onTogglePin}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}
                  {!isCollapsed && featureMetrics.length === 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">
                      이 영역의 지표가 없어요
                    </div>
                  )}
                </div>
              )
            })}

            {/* Metrics with no matching feature (defensive) */}
            {(() => {
              const knownFeatureIds = new Set(productFeatures.map(f => f.id))
              const orphans = sortMetrics(productMetrics.filter(m => !knownFeatureIds.has(m.feature_id)))
              if (orphans.length === 0) return null
              const isCollapsed = collapsed.has('__other__')
              return (
                <div key="__other__">
                  <button
                    onClick={() => toggleCollapse('__other__')}
                    className="flex items-center justify-between py-3 px-0 w-full cursor-pointer border-b border-border"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-foreground">기타</span>
                      <span className="text-xs bg-muted text-secondary rounded-full px-2 py-0.5 ml-2">
                        {orphans.length}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={16} className="text-gray-400" />
                      : <ChevronUp size={16} className="text-gray-400" />
                    }
                  </button>
                  {!isCollapsed && (
                    <div className="flex flex-col gap-3 pt-3 pb-2">
                      {orphans.map(m => (
                        <MetricCard
                          key={m.id}
                          metric={m}
                          product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                          feature={UNKNOWN_FEATURE}
                          onEdit={onEdit}
                          onTogglePin={onTogglePin}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
