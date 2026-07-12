'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, ImagePlus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { AllView } from '@/components/views/AllView'
import { ByProductView } from '@/components/views/ByProductView'
import { ByMetricView } from '@/components/views/ByMetricView'
import { AddMetricSheet } from '@/components/metrics/AddMetricSheet'
import { ParseResultReview } from '@/components/metrics/ParseResultReview'
import { storage } from '@/lib/storage/LocalStorageAdapter'
import { generateId } from '@/lib/utils/uuid'
import type { Metric, Product, Feature } from '@/types'

type Tab = 'all' | 'by-product' | 'by-metric'

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('all')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Metric | null>(null)
  const [imageParserOpen, setImageParserOpen] = useState(false)

  const load = useCallback(async () => {
    const [m, p, f] = await Promise.all([storage.getMetrics(), storage.getProducts(), storage.getFeatures()])
    setMetrics(m)
    setProducts(p)
    setFeatures(f)
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
      <Header />
      <div className="px-4 py-4">
        {/* 탭 */}
        <div className="flex border-b border-border mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer min-h-[44px] border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-secondary hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 추가 버튼 (홈에서만 표시) */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setEditTarget(null); setSheetOpen(true) }}
            className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-3 min-h-[44px] cursor-pointer hover:bg-foreground/90 transition-colors"
          >
            <Plus size={15} strokeWidth={2} />
            직접 추가
          </button>
          <button
            onClick={() => setImageParserOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium px-4 py-3 min-h-[44px] cursor-pointer hover:bg-muted transition-colors"
          >
            <ImagePlus size={15} strokeWidth={1.5} />
            이미지로 추가
          </button>
        </div>

        {/* 뷰 */}
        {tab === 'all' && (
          <AllView
            metrics={metrics}
            products={products}
            features={features}
            onEdit={handleEdit}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
          />
        )}
        {tab === 'by-product' && (
          <ByProductView
            metrics={metrics}
            products={products}
            features={features}
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
            features={features}
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
        features={features}
        editTarget={editTarget}
        onSaved={load}
        onProductsChanged={load}
        onFeaturesChanged={load}
      />
      <ParseResultReview
        open={imageParserOpen}
        onClose={() => setImageParserOpen(false)}
        products={products}
        onSaved={load}
      />
    </>
  )
}
