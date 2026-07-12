'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, LayoutList, LayoutGrid } from 'lucide-react'
import { ProductSubTabs } from '@/components/products/ProductSubTabs'
import { MetricCard } from '@/components/metrics/MetricCard'
import type { Metric, Product, Feature } from '@/types'

type ViewMode = 'list' | 'grid'
const VIEW_KEY = 'figbook_view_mode'

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
  const [view, setView] = useState<ViewMode>('grid')

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  const toggleView = (next: ViewMode) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

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
      {/* 뷰 토글 */}
      <div className="flex justify-end mt-3 mb-1">
        <div className="flex border border-border">
          <button onClick={() => toggleView('list')} aria-label="리스트 보기"
            className={`px-2.5 py-1.5 text-xs transition-colors cursor-pointer border-r border-border ${view === 'list' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
            <LayoutList size={14} />
          </button>
          <button onClick={() => toggleView('grid')} aria-label="그리드 보기"
            className={`px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${view === 'grid' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      <div className="mt-2">
        {productFeatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-secondary text-center border-t border-border">
            <p className="text-sm">아직 영역/기능이 없어요.</p>
            <p className="text-xs mt-1 text-secondary/70">지표를 추가할 때 영역/기능도 함께 만들 수 있어요.</p>
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
                    className="flex items-center justify-between py-3 w-full cursor-pointer border-b border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest uppercase text-secondary">{feature.name}</span>
                      <span className="text-xs text-secondary border border-border px-1.5 py-0.5">{featureMetrics.length}</span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={14} className="text-secondary" />
                      : <ChevronUp size={14} className="text-secondary" />
                    }
                  </button>
                  {!isCollapsed && featureMetrics.length > 0 && (
                    view === 'grid' ? (
                      <div className="grid grid-cols-2 gap-px bg-border mt-px">
                        {featureMetrics.map(m => (
                          <MetricCard
                            key={m.id}
                            metric={m}
                            product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                            feature={featureMap[m.feature_id] ?? UNKNOWN_FEATURE}
                            view={view}
                            onEdit={onEdit}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="border-t border-border">
                        {featureMetrics.map(m => (
                          <MetricCard
                            key={m.id}
                            metric={m}
                            product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                            feature={featureMap[m.feature_id] ?? UNKNOWN_FEATURE}
                            view={view}
                            onEdit={onEdit}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    )
                  )}
                  {!isCollapsed && featureMetrics.length === 0 && (
                    <div className="py-4 text-center text-xs text-secondary">
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
                    className="flex items-center justify-between py-3 w-full cursor-pointer border-b border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest uppercase text-secondary">기타</span>
                      <span className="text-xs text-secondary border border-border px-1.5 py-0.5">{orphans.length}</span>
                    </div>
                    {isCollapsed
                      ? <ChevronDown size={14} className="text-secondary" />
                      : <ChevronUp size={14} className="text-secondary" />
                    }
                  </button>
                  {!isCollapsed && (
                    view === 'grid' ? (
                      <div className="grid grid-cols-2 gap-px bg-border mt-px">
                        {orphans.map(m => (
                          <MetricCard
                            key={m.id}
                            metric={m}
                            product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                            feature={UNKNOWN_FEATURE}
                            view={view}
                            onEdit={onEdit}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="border-t border-border">
                        {orphans.map(m => (
                          <MetricCard
                            key={m.id}
                            metric={m}
                            product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                            feature={UNKNOWN_FEATURE}
                            view={view}
                            onEdit={onEdit}
                            onTogglePin={onTogglePin}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    )
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
