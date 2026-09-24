'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2 } from 'lucide-react'
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
        // 통합: source → target
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
      <div className="flex flex-col">
        {products.map(product => {
          const count = countForProduct(product.id)
          const isEditing = editingId === product.id

          return (
            <div
              key={product.id}
              className="flex items-center gap-3 py-3 border-b border-border"
            >
              <GripVertical size={16} className="text-border flex-shrink-0" />

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

              {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
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
