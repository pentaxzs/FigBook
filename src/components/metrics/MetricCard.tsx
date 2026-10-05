'use client'

import { useState } from 'react'
import { Pin, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { TrendChart } from './TrendChart'
import type { Metric, Product, Feature } from '@/types'
import type { TrendPoint } from '@/lib/utils/trend'

interface MetricCardProps {
  metric: Metric
  product: Product
  feature: Feature
  view?: 'list' | 'grid'
  trendPoints?: TrendPoint[]
  onEdit: (metric: Metric) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

function formatValue(value: string): string {
  const cleaned = value.replace(/,/g, '').trim()
  const num = Number(cleaned)
  if (cleaned !== '' && !isNaN(num) && isFinite(num)) {
    return num.toLocaleString('ko-KR')
  }
  return value
}

export function MetricCard({ metric, product, feature, view = 'grid', trendPoints, onEdit, onTogglePin, onDelete }: MetricCardProps) {
  const [showTrend, setShowTrend] = useState(false)
  const isGrid = view === 'grid'
  const hasTrend = trendPoints && trendPoints.length >= 2

  if (isGrid) {
    return (
      <div className={`bg-surface border border-border p-3 flex flex-col gap-1.5 ${metric.is_pinned ? 'border-primary/40' : ''}`}>
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] text-secondary leading-tight truncate">
            {product.name} › {feature.name}
          </span>
          {metric.is_pinned && <Pin size={9} className="text-primary shrink-0 mt-0.5" fill="currentColor" />}
        </div>
        <p className="text-xs font-semibold text-foreground leading-tight">{metric.name}</p>
        <div
          className={`flex items-baseline gap-1 mt-auto ${hasTrend ? 'cursor-pointer' : ''}`}
          onClick={hasTrend ? () => setShowTrend(v => !v) : undefined}
        >
          <span className="text-lg font-bold font-mono text-foreground">{formatValue(metric.value)}</span>
          <span className="text-xs text-secondary">{metric.unit}</span>
          {hasTrend && <TrendingUp size={10} className="text-primary ml-auto shrink-0" />}
        </div>
        <p className="text-[10px] text-secondary font-mono">{metric.base_date}</p>
        {metric.category.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metric.category.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] text-secondary border border-border px-1.5 py-0.5 rounded-sm">
                #{tag}
              </span>
            ))}
            {metric.category.length > 2 && <span className="text-[10px] text-secondary">+{metric.category.length - 2}</span>}
          </div>
        )}
        {showTrend && hasTrend && (
          <div className="border-t border-border pt-2 -mx-1">
            <TrendChart points={trendPoints} unit={metric.unit} height={100} highlightId={metric.id} />
          </div>
        )}
        <div className="flex items-center justify-end gap-0 border-t border-border/60 pt-1.5 mt-0.5 -mx-0.5">
          <button onClick={() => onEdit(metric)} aria-label="편집"
            className="p-1.5 text-secondary hover:text-foreground transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center">
            <Pencil size={11} />
          </button>
          <button onClick={() => onDelete(metric.id)} aria-label="삭제"
            className="p-1.5 text-secondary hover:text-destructive transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`border-b border-border py-4 ${metric.is_pinned ? 'bg-primary/3' : ''}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-secondary">
          {product.name} <span className="mx-0.5">›</span> {feature.name}
        </span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs text-secondary font-mono">{metric.base_date}</span>
          {metric.is_pinned && <Pin size={10} className="text-primary" fill="currentColor" />}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div
          className={`flex-1 min-w-0 ${hasTrend ? 'cursor-pointer' : ''}`}
          onClick={hasTrend ? () => setShowTrend(v => !v) : undefined}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{metric.name}</p>
            {hasTrend && <TrendingUp size={12} className="text-primary shrink-0" />}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-foreground">{formatValue(metric.value)}</span>
            <span className="text-sm text-secondary">{metric.unit}</span>
          </div>
        </div>
        <div className="flex items-center gap-0 shrink-0">
          <button onClick={() => onEdit(metric)} aria-label="편집"
            className="p-2 text-secondary hover:text-foreground transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Pencil size={14} />
          </button>
          <button onClick={() => onTogglePin(metric.id)} aria-label="핀 고정"
            className={`p-2 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${metric.is_pinned ? 'text-primary' : 'text-secondary hover:text-foreground'}`}>
            <Pin size={14} fill={metric.is_pinned ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => onDelete(metric.id)} aria-label="삭제"
            className="p-2 text-secondary hover:text-destructive transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {showTrend && hasTrend && (
        <div className="mt-3 border border-border rounded-lg p-3 bg-muted/30">
          <TrendChart points={trendPoints} unit={metric.unit} height={140} highlightId={metric.id} />
        </div>
      )}
      {metric.category.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {metric.category.map(tag => (
            <span key={tag} className="text-xs text-secondary border border-border px-2 py-0.5 rounded-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {metric.memo && <p className="text-xs text-secondary mt-1.5">{metric.memo}</p>}
    </div>
  )
}
