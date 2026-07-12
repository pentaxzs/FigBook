'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, ImagePlus, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { AllView } from '@/components/views/AllView'
import { ByProductView } from '@/components/views/ByProductView'
import { ByMetricView } from '@/components/views/ByMetricView'
import { AddMetricSheet } from '@/components/metrics/AddMetricSheet'
import { ParseResultReview } from '@/components/metrics/ParseResultReview'
import { storage } from '@/lib/storage'
import { useAuth } from '@/components/auth/AuthProvider'
import { generateId } from '@/lib/utils/uuid'
import type { Metric, Product, Feature } from '@/types'

type Tab = 'all' | 'by-product' | 'by-metric'
type ViewMode = 'list' | 'grid'
const VIEW_KEY = 'figbook_view_mode'

const PULL_THRESHOLD = 64

export default function HomePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Metric | null>(null)
  const [imageParserOpen, setImageParserOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullY, setPullY] = useState(0)
  const touchStartY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null
    if (saved === 'grid' || saved === 'list') setView(saved)
  }, [])

  const toggleView = (next: ViewMode) => {
    setView(next)
    localStorage.setItem(VIEW_KEY, next)
  }

  const load = useCallback(async () => {
    const [m, p, f] = await Promise.all([storage.getMetrics(), storage.getProducts(), storage.getFeatures()])
    setMetrics(m)
    setProducts(p)
    setFeatures(f)
  }, [])

  // Re-load whenever the auth user changes (fixes race with Supabase adapter swap)
  useEffect(() => { load() }, [load, user])

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY.current = e.touches[0].clientY
        pulling.current = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - touchStartY.current
      if (dy > 0) {
        setPullY(Math.min(dy * 0.5, PULL_THRESHOLD))
      }
    }
    const onTouchEnd = async () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= PULL_THRESHOLD) {
        setRefreshing(true)
        await load()
        setRefreshing(false)
      }
      setPullY(0)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [load, pullY])

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

  const pullProgress = Math.min(pullY / PULL_THRESHOLD, 1)

  return (
    <>
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className="fixed top-14 left-0 right-0 z-30 flex items-center justify-center transition-all"
          style={{ height: refreshing ? 40 : pullY, opacity: refreshing ? 1 : pullProgress }}
        >
          <RefreshCw
            size={18}
            className={`text-secondary ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullProgress * 180}deg)` }}
          />
        </div>
      )}

      <Header view={view} onToggleView={toggleView} />
      <div
        className="px-4 py-4 transition-transform"
        style={{ transform: pullY > 0 ? `translateY(${pullY}px)` : undefined }}
      >
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
        <div className="flex mb-4">
          <button
            onClick={() => { setEditTarget(null); setSheetOpen(true) }}
            className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background text-sm font-medium px-4 py-4 min-h-[52px] cursor-pointer hover:bg-foreground/90 transition-colors"
          >
            <Plus size={15} strokeWidth={2} />
            직접 추가
          </button>
          <button
            onClick={() => setImageParserOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-medium px-4 py-4 min-h-[52px] cursor-pointer hover:bg-primary/90 transition-colors"
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
            view={view}
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
            view={view}
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
            view={view}
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
