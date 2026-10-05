'use client'

import type { TrendPoint } from '@/lib/utils/trend'

interface TrendChartProps {
  points: TrendPoint[]
  unit?: string
  height?: number
  highlightId?: string
}

function formatDate(date: string): string {
  const parts = date.split('-')
  if (parts.length >= 2) return `${parts[0].slice(2)}.${parts[1]}`
  return date
}

function formatCompactValue(value: string): string {
  if (value.length > 6) return value.slice(0, 5) + '…'
  return value
}

export function TrendChart({ points, unit, height = 140, highlightId }: TrendChartProps) {
  if (points.length < 2) return null

  const W = 300
  const H = height
  const padTop = 32
  const padBottom = 22
  const padX = 20
  const chartW = W - padX * 2
  const chartH = H - padTop - padBottom

  const values = points.map(p => p.numValue)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const coords = points.map((p, i) => ({
    x: padX + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW),
    y: padTop + chartH - ((p.numValue - minVal) / range) * chartH,
    ...p,
  }))

  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ')

  const areaPath = `M${coords[0].x},${padTop + chartH} ` +
    coords.map(c => `L${c.x},${c.y}`).join(' ') +
    ` L${coords[coords.length - 1].x},${padTop + chartH} Z`

  const first = coords[0]
  const last = coords[coords.length - 1]
  const changePercent = first.numValue !== 0
    ? ((last.numValue - first.numValue) / Math.abs(first.numValue)) * 100
    : null
  const isUp = last.numValue > first.numValue
  const isDown = last.numValue < first.numValue

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: height * 1.2 }}>
        {/* Grid lines */}
        <line x1={padX} y1={padTop} x2={padX + chartW} y2={padTop} stroke="var(--color-border)" strokeWidth="0.5" />
        <line x1={padX} y1={padTop + chartH} x2={padX + chartW} y2={padTop + chartH} stroke="var(--color-border)" strokeWidth="0.5" />

        {/* Area fill */}
        <path d={areaPath} fill="var(--color-primary)" opacity="0.07" />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points and labels */}
        {coords.map((c, i) => {
          const isHighlight = highlightId === c.metricId
          const isEdge = i === 0 || i === coords.length - 1
          const showLabel = isEdge || isHighlight || coords.length <= 6

          return (
            <g key={c.metricId + i}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isHighlight ? 4 : 3}
                fill={isHighlight ? 'var(--color-primary)' : 'var(--color-surface, #fff)'}
                stroke="var(--color-primary)"
                strokeWidth={isHighlight ? 2.5 : 1.5}
              />
              {showLabel && (
                <text
                  x={c.x}
                  y={c.y - 8}
                  textAnchor="middle"
                  fill="var(--color-foreground)"
                  fontSize="9"
                  fontWeight={isEdge ? '700' : '500'}
                  fontFamily="monospace"
                >
                  {formatCompactValue(c.value)}
                </text>
              )}
              <text
                x={c.x}
                y={padTop + chartH + 14}
                textAnchor="middle"
                fill="var(--color-secondary)"
                fontSize="8"
                fontFamily="monospace"
              >
                {formatDate(c.date)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Change indicator */}
      {changePercent !== null && (
        <div className="flex items-center justify-end gap-1.5 px-1 -mt-1 mb-1">
          <span className={`text-xs font-mono font-semibold ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-secondary'}`}>
            {isUp ? '▲' : isDown ? '▼' : '—'} {Math.abs(changePercent).toFixed(1)}%
          </span>
          {unit && <span className="text-[10px] text-secondary">({first.value} → {last.value}{unit})</span>}
        </div>
      )}
    </div>
  )
}
