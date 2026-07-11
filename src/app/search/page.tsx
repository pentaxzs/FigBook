'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { SearchBar } from '@/components/search/SearchBar'
import { MetricCard } from '@/components/metrics/MetricCard'
import { storage } from '@/lib/storage/LocalStorageAdapter'
import { filterMetrics } from '@/lib/utils/search'
import type { Metric, Product } from '@/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([storage.getMetrics(), storage.getProducts()]).then(([m, p]) => {
      setMetrics(m); setProducts(p)
    })
    storage.getRecentSearches().then(setRecent)
  }, [])

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  const results = useMemo(() => {
    const base = selectedProductId
      ? metrics.filter(m => m.product_id === selectedProductId)
      : metrics
    return query.trim() ? filterMetrics(base, query) : []
  }, [metrics, query, selectedProductId])

  const handleQueryChange = (q: string) => {
    setQuery(q)
    if (q.trim().length >= 2) {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = setTimeout(async () => {
        await storage.saveRecentSearch(q.trim())
        const updated = await storage.getRecentSearches()
        setRecent(updated)
      }, 500)
    }
  }

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([storage.getMetrics(), storage.getProducts()])
    setMetrics(m); setProducts(p)
  }, [])

  const handleTogglePin = async (id: string) => {
    const metric = metrics.find(m => m.id === id)
    if (!metric) return
    await storage.updateMetric(id, { is_pinned: !metric.is_pinned })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return
    await storage.deleteMetric(id)
    load()
  }

  return (
    <div className="px-4 py-4">
      <SearchBar
        query={query}
        onQueryChange={handleQueryChange}
        products={products}
        selectedProductId={selectedProductId}
        onProductChange={setSelectedProductId}
      />

      <div className="mt-4">
        {!query.trim() ? (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2">최근 검색어</p>
            <div className="flex flex-wrap gap-2">
              {recent.map(q => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="text-sm px-3 py-1.5 bg-muted rounded-full text-foreground hover:bg-border cursor-pointer"
                >
                  {q}
                </button>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-gray-400">최근 검색어가 없어요</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              {results.length > 0 ? `결과 ${results.length}개` : '검색 결과가 없어요'}
            </p>
            <div className="flex flex-col gap-3">
              {results.map(m => (
                <MetricCard
                  key={m.id}
                  metric={m}
                  product={productMap[m.product_id] ?? { id: '', user_id: 'local', name: '알 수 없음', order: 0, created_at: '' }}
                  onEdit={() => {}}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
