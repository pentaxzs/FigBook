'use client'

import { Pin, Pencil, Trash2 } from 'lucide-react'
import type { Metric, Product } from '@/types'

interface MetricCardProps {
  metric: Metric
  product: Product
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function MetricCard({ metric, product, onEdit, onTogglePin, onDelete }: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 shadow-sm transition-all duration-150 ${
        metric.is_pinned ? 'border-accent/40 shadow-accent/10' : 'border-border'
      }`}
    >
      {/* 헤더: 프로덕트명 + 기준날짜 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-secondary font-medium">
          {product.name}
        </span>
        <span className="text-xs text-gray-400 font-mono">{metric.base_date}</span>
      </div>

      {/* 지표명 */}
      <p className="text-sm font-semibold text-foreground mb-1">{metric.name}</p>

      {/* 값 + 단위 */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold font-mono text-primary">{metric.value}</span>
        <span className="text-sm text-gray-500">{metric.unit}</span>
      </div>

      {/* 카테고리 태그 */}
      {metric.category.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {metric.category.map(tag => (
            <span key={tag} className="text-xs bg-muted text-secondary px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 메모 */}
      {metric.memo && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{metric.memo}</p>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
        <button
          onClick={() => onEdit(metric)}
          aria-label="편집"
          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-muted transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onTogglePin(metric.id)}
          aria-label="핀 고정"
          data-pinned={metric.is_pinned}
          className={`p-2 rounded-lg transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
            metric.is_pinned
              ? 'text-accent bg-accent/10'
              : 'text-gray-400 hover:text-accent hover:bg-muted'
          }`}
        >
          <Pin size={15} fill={metric.is_pinned ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => onDelete(metric.id)}
          aria-label="삭제"
          className="p-2 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
