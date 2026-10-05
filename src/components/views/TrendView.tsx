'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TrendChart } from '@/components/metrics/TrendChart'
import { groupMetricsForTrend } from '@/lib/utils/trend'
import type { Metric, Product, Feature } from '@/types'

interface TrendViewProps {
  metrics: Metric[]
  products: Product[]
  features: Feature[]
}

const UNKNOWN = '알 수 없음'

export function TrendView({ metrics, products, features }: TrendViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))

  const groups = groupMetricsForTrend(metrics)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-secondary border-t border-border text-center">
        <p className="text-sm">추이를 볼 수 있는 지표가 없어요</p>
        <p className="text-xs mt-1 text-secondary/70">
          같은 프로덕트 &gt; 영역 &gt; 지표명으로 기준 날짜가 다른 지표를 2개 이상 추가하면 추이가 표시돼요
        </p>
      </div>
    )
  }

  const toggle = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map(group => {
        const product = productMap[group.productId]
        const feature = featureMap[group.featureId]
        const isCollapsed = collapsed.has(group.key)
        const latest = group.points[group.points.length - 1]
        const first = group.points[0]
        const changePercent = first.numValue !== 0
          ? ((latest.numValue - first.numValue) / Math.abs(first.numValue)) * 100
          : null
        const isUp = latest.numValue > first.numValue
        const isDown = latest.numValue < first.numValue

        return (
          <div key={group.key} className="border border-border bg-surface">
            <button
              onClick={() => toggle(group.key)}
              className="w-full p-4 flex items-start justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] text-secondary truncate">
                  {product?.name ?? UNKNOWN} › {feature?.name ?? UNKNOWN}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{group.metricName}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold font-mono text-foreground">
                    {latest.value}
                  </span>
                  {group.unit && <span className="text-xs text-secondary">{group.unit}</span>}
                  {changePercent !== null && (
                    <span className={`text-xs font-mono font-semibold ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-secondary'}`}>
                      {isUp ? '▲' : isDown ? '▼' : '—'}{Math.abs(changePercent).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-secondary mt-0.5 font-mono">
                  {group.points.length}개 데이터 · {first.date} ~ {latest.date}
                </p>
              </div>
              <div className="shrink-0 mt-1 ml-2">
                {isCollapsed
                  ? <ChevronRight size={14} className="text-secondary" />
                  : <ChevronDown size={14} className="text-secondary" />
                }
              </div>
            </button>
            {!isCollapsed && (
              <div className="px-3 pb-3">
                <TrendChart
                  points={group.points}
                  unit={group.unit}
                  height={160}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
