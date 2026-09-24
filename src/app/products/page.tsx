'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { useAuth } from '@/components/auth/AuthProvider'
import { generateId } from '@/lib/utils/uuid'
import type { Product, Feature, Metric } from '@/types'

export default function ProductsPage() {
  const { ready } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // 드래그 상태
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragY = useRef(0)
  const itemRects = useRef<DOMRect[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [p, m, f] = await Promise.all([
      storage.getProducts(),
      storage.getMetrics(),
      storage.getFeatures(),
    ])
    setProducts(p)
    setMetrics(m)
    setFeatures(f)
  }, [])

  useEffect(() => { if (ready) load() }, [load, ready])

  const countForProduct = (id: string) => metrics.filter(m => m.product_id === id).length

  // --- 순서 저장 ---
  const saveOrder = async (reordered: Product[]) => {
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].order !== i) {
        await storage.updateProduct(reordered[i].id, { order: i })
      }
    }
  }

  // --- 드래그 핸들러 (터치) ---
  const onDragStart = (index: number, clientY: number) => {
    if (editingId) return
    setDragIndex(index)
    setOverIndex(index)
    dragY.current = clientY
    // 각 아이템의 위치 기록
    if (listRef.current) {
      const children = listRef.current.children
      itemRects.current = Array.from(children).map(c => c.getBoundingClientRect())
    }
  }

  const onDragMove = (clientY: number) => {
    if (dragIndex === null) return
    const rects = itemRects.current
    // 현재 Y 위치에서 가장 가까운 인덱스 찾기
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
    const reordered = [...products]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(overIndex, 0, moved)
    setProducts(reordered)
    setDragIndex(null)
    setOverIndex(null)
    await saveOrder(reordered)
  }

  // --- PC: 위/아래 버튼으로 이동 ---
  const moveProduct = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= products.length) return
    const reordered = [...products]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setProducts(reordered)
    await saveOrder(reordered)
  }

  // --- 추가/편집/삭제 ---
  const handleAdd = async () => {
    const name = prompt('프로덕트 이름을 입력하세요')
    if (!name?.trim()) return
    const existing = products.find(p => p.name === name.trim())
    if (existing) {
      alert('이미 존재하는 프로덕트 이름이에요.')
      return
    }
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

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditName(product.name)
  }

  const saveEdit = async (product: Product) => {
    const trimmed = editName.trim()
    if (!trimmed) { setEditingId(null); return }
    if (trimmed === product.name) { setEditingId(null); return }

    const existing = products.find(p => p.name === trimmed && p.id !== product.id)
    if (existing) {
      if (confirm(`"${trimmed}" 프로덕트가 이미 있어요. 기존 프로덕트에 통합할까요?`)) {
        const allMetrics = await storage.getMetrics()
        const allFeatures = await storage.getFeatures()
        for (const m of allMetrics.filter(m => m.product_id === product.id)) {
          await storage.updateMetric(m.id, { product_id: existing.id })
        }
        for (const f of allFeatures.filter(f => f.product_id === product.id)) {
          await storage.updateFeature(f.id, { product_id: existing.id })
        }
        await storage.deleteProduct(product.id)
        load()
      }
      setEditingId(null)
      return
    }

    await storage.updateProduct(product.id, { name: trimmed })
    setEditingId(null)
    load()
  }

  const handleDelete = async (product: Product) => {
    const count = countForProduct(product.id)
    const msg = count > 0
      ? `"${product.name}"을(를) 삭제하면 하위 지표 ${count}개는 전체 탭에서 확인할 수 있어요. 삭제할까요?`
      : `"${product.name}"을(를) 삭제할까요?`
    if (!confirm(msg)) return

    const productMetrics = metrics.filter(m => m.product_id === product.id)
    const productFeatures = features.filter(f => f.product_id === product.id)
    for (const m of productMetrics) {
      await storage.updateMetric(m.id, { product_id: '', feature_id: '' })
    }
    for (const f of productFeatures) {
      await storage.deleteFeature(f.id)
    }
    await storage.deleteProduct(product.id)
    load()
  }

  // 드래그 중 미리보기용 순서 계산
  const displayProducts = (() => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) return products
    const reordered = [...products]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(overIndex, 0, moved)
    return reordered
  })()

  return (
    <div className="px-4 py-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 -ml-2 text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="뒤로"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">프로덕트 관리</h1>
      </div>

      {/* 리스트 */}
      <div ref={listRef} className="flex flex-col">
        {displayProducts.map((product, index) => {
          const count = countForProduct(product.id)
          const isEditing = editingId === product.id
          const isDragging = dragIndex !== null && product.id === products[dragIndex]?.id

          return (
            <div
              key={product.id}
              className={`flex items-center gap-2 py-3 border-b border-border transition-colors ${
                isDragging ? 'bg-muted/60' : ''
              }`}
            >
              {/* 드래그 핸들 (모바일: 터치 드래그) */}
              <div
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
                onTouchStart={e => {
                  e.stopPropagation()
                  onDragStart(index, e.touches[0].clientY)
                }}
                onTouchMove={e => {
                  e.stopPropagation()
                  onDragMove(e.touches[0].clientY)
                }}
                onTouchEnd={() => onDragEnd()}
                onMouseDown={e => {
                  e.preventDefault()
                  onDragStart(index, e.clientY)
                  const onMove = (ev: MouseEvent) => onDragMove(ev.clientY)
                  const onUp = () => {
                    onDragEnd()
                    window.removeEventListener('mousemove', onMove)
                    window.removeEventListener('mouseup', onUp)
                  }
                  window.addEventListener('mousemove', onMove)
                  window.addEventListener('mouseup', onUp)
                }}
              >
                <GripVertical size={16} className="text-secondary" />
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(product)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => saveEdit(product)}
                    autoFocus
                    className="w-full text-sm font-medium bg-transparent border-b-2 border-primary py-1 outline-none"
                  />
                ) : (
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-secondary">지표 {count}개</p>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              {!isEditing && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {/* PC: 위/아래 이동 버튼 */}
                  <div className="hidden sm:flex flex-col">
                    <button
                      onClick={() => moveProduct(index, -1)}
                      disabled={index === 0}
                      className="w-8 h-5 flex items-center justify-center text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors"
                      aria-label="위로 이동"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === displayProducts.length - 1}
                      className="w-8 h-5 flex items-center justify-center text-secondary hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors"
                      aria-label="아래로 이동"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => startEdit(product)}
                    className="w-10 h-10 flex items-center justify-center text-secondary hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="이름 변경"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
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

      {/* 빈 상태 */}
      {products.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <p className="text-sm">아직 프로덕트가 없어요.</p>
          <p className="text-xs mt-1">아래 버튼으로 추가해보세요.</p>
        </div>
      )}

      {/* 추가 버튼 */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 mt-4 py-4 text-sm font-medium text-secondary border border-dashed border-border hover:bg-muted cursor-pointer transition-colors min-h-[52px]"
      >
        <Plus size={16} />
        프로덕트 추가
      </button>
    </div>
  )
}
