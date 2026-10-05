'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { useAuth } from '@/components/auth/AuthProvider'
import { generateId } from '@/lib/utils/uuid'
import type { Product, Feature, Metric } from '@/types'

export default function FeaturesPage() {
  const { ready } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const itemRects = useRef<DOMRect[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [p, f, m] = await Promise.all([
      storage.getProducts(),
      storage.getFeatures(),
      storage.getMetrics(),
    ])
    setProducts(p)
    setFeatures(f)
    setMetrics(m)
  }, [])

  useEffect(() => { if (ready) load() }, [load, ready])

  useEffect(() => {
    if (products.length > 0 && selectedProductId === null) {
      setSelectedProductId(products[0].id)
    }
  }, [products, selectedProductId])

  const productFeatures = features
    .filter(f => f.product_id === selectedProductId)
    .sort((a, b) => a.order - b.order)

  const countForFeature = (id: string) => metrics.filter(m => m.feature_id === id).length

  const saveOrder = async (reordered: Feature[]) => {
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].order !== i) {
        await storage.updateFeature(reordered[i].id, { order: i })
      }
    }
  }

  const onDragStart = (index: number, clientY: number) => {
    if (editingId) return
    setDragIndex(index)
    setOverIndex(index)
    if (listRef.current) {
      const children = listRef.current.children
      itemRects.current = Array.from(children).map(c => c.getBoundingClientRect())
    }
  }

  const onDragMove = (clientY: number) => {
    if (dragIndex === null) return
    const rects = itemRects.current
    let closest = dragIndex
    for (let i = 0; i < rects.length; i++) {
      const mid = rects[i].top + rects[i].height / 2
      if (clientY < mid) { closest = i; break }
      closest = i
    }
    setOverIndex(closest)
  }

  const onDragEnd = async () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const reordered = [...productFeatures]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(overIndex, 0, moved)
    setFeatures(prev => {
      const others = prev.filter(f => f.product_id !== selectedProductId)
      return [...others, ...reordered.map((f, i) => ({ ...f, order: i }))]
    })
    setDragIndex(null)
    setOverIndex(null)
    await saveOrder(reordered)
  }

  const moveFeature = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= productFeatures.length) return
    const reordered = [...productFeatures]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setFeatures(prev => {
      const others = prev.filter(f => f.product_id !== selectedProductId)
      return [...others, ...reordered.map((f, i) => ({ ...f, order: i }))]
    })
    await saveOrder(reordered)
  }

  const handleAdd = async () => {
    if (!selectedProductId) return
    const name = prompt('영역/기능 이름을 입력하세요')
    if (!name?.trim()) return
    const existing = productFeatures.find(f => f.name === name.trim())
    if (existing) {
      alert('이미 존재하는 영역/기능 이름이에요.')
      return
    }
    const feature: Feature = {
      id: generateId(),
      user_id: 'local',
      product_id: selectedProductId,
      name: name.trim(),
      order: productFeatures.length,
      created_at: new Date().toISOString(),
    }
    await storage.saveFeature(feature)
    load()
  }

  const startEdit = (feature: Feature) => {
    setEditingId(feature.id)
    setEditName(feature.name)
  }

  const saveEdit = async (feature: Feature) => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === feature.name) { setEditingId(null); return }

    const existing = productFeatures.find(f => f.name === trimmed && f.id !== feature.id)
    if (existing) {
      if (confirm(`"${trimmed}" 영역/기능이 이미 있어요. 기존 항목에 통합할까요?`)) {
        const featureMetrics = metrics.filter(m => m.feature_id === feature.id)
        for (const m of featureMetrics) {
          await storage.updateMetric(m.id, { feature_id: existing.id })
        }
        await storage.deleteFeature(feature.id)
        load()
      }
      setEditingId(null)
      return
    }

    await storage.updateFeature(feature.id, { name: trimmed })
    setEditingId(null)
    load()
  }

  const handleDelete = async (feature: Feature) => {
    const count = countForFeature(feature.id)
    const msg = count > 0
      ? `"${feature.name}"을(를) 삭제하면 하위 지표 ${count}개의 영역/기능이 해제돼요. 삭제할까요?`
      : `"${feature.name}"을(를) 삭제할까요?`
    if (!confirm(msg)) return

    if (count > 0) {
      const featureMetrics = metrics.filter(m => m.feature_id === feature.id)
      for (const m of featureMetrics) {
        await storage.updateMetric(m.id, { feature_id: '' })
      }
    }
    await storage.deleteFeature(feature.id)
    load()
  }

  const displayFeatures = (() => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) return productFeatures
    const reordered = [...productFeatures]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(overIndex, 0, moved)
    return reordered
  })()

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="flex items-center justify-center w-10 h-10 -ml-2 text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="뒤로"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">영역/기능 관리</h1>
      </div>

      {/* 프로덕트 선택 */}
      {products.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto mb-6 -mx-4 px-4" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom' }}>
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedProductId(p.id); setEditingId(null) }}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors min-h-[44px] ${
                selectedProductId === p.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-secondary hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <p className="text-sm">먼저 프로덕트를 추가해주세요.</p>
          <Link href="/products" className="text-sm text-primary mt-2 inline-block">프로덕트 관리로 이동</Link>
        </div>
      )}

      {/* 리스트 */}
      {selectedProductId && (
        <>
          <div ref={listRef} className="flex flex-col">
            {displayFeatures.map((feature, index) => {
              const count = countForFeature(feature.id)
              const isEditing = editingId === feature.id
              const isDragging = dragIndex !== null && feature.id === productFeatures[dragIndex]?.id

              return (
                <div
                  key={feature.id}
                  className={`flex items-center gap-2 py-3 border-b border-border transition-colors ${
                    isDragging ? 'bg-muted/60' : ''
                  }`}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
                    onTouchStart={e => { e.stopPropagation(); onDragStart(index, e.touches[0].clientY) }}
                    onTouchMove={e => { e.stopPropagation(); onDragMove(e.touches[0].clientY) }}
                    onTouchEnd={() => onDragEnd()}
                    onMouseDown={e => {
                      e.preventDefault()
                      onDragStart(index, e.clientY)
                      const onMove = (ev: MouseEvent) => onDragMove(ev.clientY)
                      const onUp = () => { onDragEnd(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                      window.addEventListener('mousemove', onMove)
                      window.addEventListener('mouseup', onUp)
                    }}
                  >
                    <GripVertical size={16} className="text-secondary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(feature)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={() => saveEdit(feature)}
                        autoFocus
                        className="w-full text-sm font-medium bg-transparent border-b-2 border-primary py-1 outline-none"
                      />
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-foreground truncate">{feature.name}</p>
                        <p className="text-xs text-secondary">지표 {count}개</p>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <div className="hidden sm:flex flex-col">
                        <button
                          onClick={() => moveFeature(index, -1)}
                          disabled={index === 0}
                          className="w-8 h-5 flex items-center justify-center text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors"
                          aria-label="위로 이동"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveFeature(index, 1)}
                          disabled={index === displayFeatures.length - 1}
                          className="w-8 h-5 flex items-center justify-center text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors"
                          aria-label="아래로 이동"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => startEdit(feature)}
                        className="w-10 h-10 flex items-center justify-center text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        aria-label="이름 변경"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(feature)}
                        className="w-10 h-10 flex items-center justify-center text-secondary hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        aria-label="삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {productFeatures.length === 0 && (
            <div className="text-center py-16 text-secondary">
              <p className="text-sm">{selectedProduct?.name}에 영역/기능이 없어요.</p>
              <p className="text-xs mt-1">아래 버튼으로 추가해보세요.</p>
            </div>
          )}

          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 mt-4 py-4 text-sm font-medium text-secondary border border-dashed border-border hover:bg-muted cursor-pointer transition-colors min-h-[52px]"
          >
            <Plus size={16} />
            영역/기능 추가
          </button>
        </>
      )}
    </div>
  )
}
