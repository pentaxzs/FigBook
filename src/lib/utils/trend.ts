import type { Metric } from '@/types'

const KOREAN_MULT: [string, number][] = [['억', 1e8], ['만', 1e4], ['천', 1e3]]

export function parseNumericValue(value: string): number | null {
  let cleaned = value.replace(/,/g, '').trim()
  for (const [suffix, mult] of KOREAN_MULT) {
    if (cleaned.endsWith(suffix)) {
      const num = parseFloat(cleaned.slice(0, -suffix.length))
      return isNaN(num) ? null : num * mult
    }
  }
  cleaned = cleaned.replace(/[%명개건원달러위회초분시일]$/, '')
  const num = parseFloat(cleaned)
  return isNaN(num) || !isFinite(num) ? null : num
}

export interface TrendPoint {
  date: string
  value: string
  numValue: number
  metricId: string
}

export interface TrendGroup {
  key: string
  productId: string
  featureId: string
  metricName: string
  unit: string
  points: TrendPoint[]
}

export function groupMetricsForTrend(metrics: Metric[]): TrendGroup[] {
  const groups = new Map<string, Metric[]>()
  for (const m of metrics) {
    if (!m.base_date) continue
    const key = `${m.product_id}:${m.feature_id}:${m.name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  const result: TrendGroup[] = []
  for (const [key, ms] of groups) {
    if (ms.length < 2) continue
    const sorted = [...ms].sort((a, b) => a.base_date.localeCompare(b.base_date))
    const points: TrendPoint[] = []
    for (const m of sorted) {
      const numValue = parseNumericValue(m.value)
      if (numValue !== null) {
        points.push({ date: m.base_date, value: m.value, numValue, metricId: m.id })
      }
    }
    if (points.length < 2) continue
    result.push({
      key,
      productId: ms[0].product_id,
      featureId: ms[0].feature_id,
      metricName: ms[0].name,
      unit: ms[0].unit,
      points,
    })
  }

  return result.sort((a, b) => b.points.length - a.points.length)
}

export function getSiblingPoints(metric: Metric, allMetrics: Metric[]): TrendPoint[] {
  if (!metric.base_date) return []
  const siblings = allMetrics.filter(
    m => m.product_id === metric.product_id &&
      m.feature_id === metric.feature_id &&
      m.name === metric.name &&
      m.base_date
  )
  if (siblings.length < 2) return []
  const sorted = [...siblings].sort((a, b) => a.base_date.localeCompare(b.base_date))
  const points: TrendPoint[] = []
  for (const m of sorted) {
    const numValue = parseNumericValue(m.value)
    if (numValue !== null) {
      points.push({ date: m.base_date, value: m.value, numValue, metricId: m.id })
    }
  }
  return points.length >= 2 ? points : []
}
