'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import type { Metric, Product, Feature } from '@/types'

type ViewMode = 'list' | 'grid'

interface ByMetricViewProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  view: ViewMode
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }

export function ByMetricView({ metrics, products, features, view, onEdit, onTogglePin, onDelete }: ByMetricViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))

  // 카테고리별 그룹핑 (태그 없는 지표는 '미분류')
  const groups = new Map<string, Metric[]>()
  for (const m of metrics) {
    const tags = m.category.length > 0 ? m.category : ['미분류']
    for (const tag of tags) {
      if (!groups.has(tag)) groups.set(tag, [])
      groups.get(tag)!.push(m)
    }
  }

  if (groups.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-secondary border-t border-border">
        <p className="text-sm">카테고리 태그를 추가하면 여기서 모아볼 수 있어요</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {Array.from(groups.entries()).map(([tag, tagMetrics]) => {
          const isCollapsed = collapsed.has(tag)
          return (
            <div key={tag} className="overflow-hidden">
              <button
                onClick={() => setCollapsed(prev => {
                  const next = new Set(prev)
                  isCollapsed ? next.delete(tag) : next.add(tag)
                  return next
                })}
                className="flex items-center justify-between py-3 w-full cursor-pointer border-b border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest uppercase text-secondary">#{tag}</span>
                  <span className="text-xs text-secondary border border-border px-1.5 py-0.5">{tagMetrics.length}</span>
                </div>
                {isCollapsed ? <ChevronRight size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
              </button>
              {!isCollapsed && (
                view === 'grid' ? (
                  <div className="grid grid-cols-2 gap-px bg-border mt-px">
                    {tagMetrics.map(m => (
                      <MetricCard
                        key={m.id}
                        metric={m}
                        product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                        feature={featureMap[m.feature_id] ?? UNKNOWN_FEATURE}
                        view="grid"
                        onEdit={onEdit}
                        onTogglePin={onTogglePin}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border-t border-border">
                    {tagMetrics.map(m => (
                      <MetricCard
                        key={m.id}
                        metric={m}
                        product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                        feature={featureMap[m.feature_id] ?? UNKNOWN_FEATURE}
                        view="list"
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
        })}
      </div>
    </div>
  )
}
