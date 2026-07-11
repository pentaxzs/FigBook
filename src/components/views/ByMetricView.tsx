'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { MetricCard } from '@/components/metrics/MetricCard'
import type { Metric, Product } from '@/types'

interface ByMetricViewProps {
  metrics: Metric[]
  products: Product[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function ByMetricView({ metrics, products, onEdit, onTogglePin, onDelete }: ByMetricViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

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
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">카테고리 태그를 추가하면 여기서 모아볼 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([tag, tagMetrics]) => {
        const isCollapsed = collapsed.has(tag)
        return (
          <div key={tag} className="bg-white rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setCollapsed(prev => {
                const next = new Set(prev)
                isCollapsed ? next.delete(tag) : next.add(tag)
                return next
              })}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
            >
              <span className="text-sm font-semibold text-foreground">
                #{tag}
                <span className="ml-2 text-xs text-gray-400 font-normal">({tagMetrics.length}개)</span>
              </span>
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            {!isCollapsed && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {tagMetrics.map(m => (
                  <MetricCard
                    key={m.id}
                    metric={m}
                    product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                    onEdit={onEdit}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
