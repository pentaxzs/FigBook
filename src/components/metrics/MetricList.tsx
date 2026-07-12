'use client'

import { useState, useEffect } from 'react'
import { LayoutList, LayoutGrid } from 'lucide-react'
import { MetricCard } from './MetricCard'
import type { Metric, Product, Feature } from '@/types'

type ViewMode = 'list' | 'grid'

interface MetricListProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

const UNKNOWN_PRODUCT: Product = { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }
const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }
const VIEW_KEY = 'figbook_view_mode'

export function MetricList({ metrics, products, features, onEdit, onTogglePin, onDelete }: MetricListProps) {
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

  const sorted = [...metrics].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-secondary border-t border-border">
        <p className="text-sm">아직 지표가 없어요</p>
        <p className="text-xs mt-1 text-secondary/70">직접 추가 또는 이미지로 추가해보세요</p>
      </div>
    )
  }

  return (
    <div>
      {/* 뷰 토글 */}
      <div className="flex justify-end mb-3">
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

      {/* 카드 목록 */}
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-px bg-border">
          {sorted.map(metric => (
            <MetricCard
              key={metric.id}
              metric={metric}
              product={productMap[metric.product_id] ?? UNKNOWN_PRODUCT}
              feature={featureMap[metric.feature_id] ?? UNKNOWN_FEATURE}
              view="grid"
              onEdit={onEdit}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="border-t border-border">
          {sorted.map(metric => (
            <MetricCard
              key={metric.id}
              metric={metric}
              product={productMap[metric.product_id] ?? UNKNOWN_PRODUCT}
              feature={featureMap[metric.feature_id] ?? UNKNOWN_FEATURE}
              view="list"
              onEdit={onEdit}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
