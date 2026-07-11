'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { AllView } from '@/components/views/AllView'
import { ByProductView } from '@/components/views/ByProductView'
import { ByMetricView } from '@/components/views/ByMetricView'
import { AddMetricSheet } from '@/components/metrics/AddMetricSheet'
import { storage } from '@/lib/storage/LocalStorageAdapter'
import { generateId } from '@/lib/utils/uuid'
import type { Metric, Product } from '@/types'

type Tab = 'all' | 'by-product' | 'by-metric'

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('all')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Metric | null>(null)
  // TODO: Task 10 — ParseResultReview component not yet implemented
  const [imageParserOpen, setImageParserOpen] = useState(false)

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([storage.getMetrics(), storage.getProducts()])
    setMetrics(m)
    setProducts(p)
  }, [])

  useEffect(() => { load() }, [load])

  const handleTogglePin = async (id: string) => {
    const metric = metrics.find(m => m.id === id)
    if (!metric) return
    await storage.updateMetric(id, { is_pinned: !metric.is_pinned })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 지표를 삭제할까요?')) return
    await storage.deleteMetric(id)
    load()
  }

  const handleEdit = (metric: Metric) => {
    setEditTarget(metric)
    setSheetOpen(true)
  }

  const handleAddProduct = async () => {
    const name = prompt('프로덕트 이름을 입력하세요')
    if (!name?.trim()) return
    const product: Product = {
      id: generateId(),
      user_id: 'local',
      name: name.trim(),
      order: products.length,
      created_at: new Date().toISOString(),
    }
    await storage.saveProduct(product)
    load()
  }

  const handleEditProduct = async (product: Product) => {
    const name = prompt('새 이름을 입력하세요', product.name)
    if (!name?.trim()) return
    await storage.updateProduct(product.id, { name: name.trim() })
    load()
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('프로덕트를 삭제하면 관련 지표는 유지됩니다. 삭제할까요?')) return
    await storage.deleteProduct(id)
    load()
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'by-product', label: '프로덕트별' },
    { key: 'by-metric', label: '지표별' },
  ]

  return (
    <>
      <Header
        onAddMetric={() => { setEditTarget(null); setSheetOpen(true) }}
      />
      <div className="px-4 py-4">
        {/* 탭 */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 min-h-[44px] ${
                tab === t.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 뷰 */}
        {tab === 'all' && (
          <AllView
            metrics={metrics}
            products={products}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
          />
        )}
        {tab === 'by-product' && (
          <ByProductView
            metrics={metrics}
            products={products}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        {tab === 'by-metric' && (
          <ByMetricView
            metrics={metrics}
            products={products}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddMetricSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        products={products}
        editTarget={editTarget}
        onSaved={load}
        onOpenImageParser={() => { setSheetOpen(false); setImageParserOpen(true) }}
      />
      {/* TODO: Task 10 — ParseResultReview placeholder, imageParserOpen={imageParserOpen} */}
    </>
  )
}
