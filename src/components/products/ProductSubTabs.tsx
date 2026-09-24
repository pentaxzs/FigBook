'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Product } from '@/types'

interface ProductSubTabsProps {
  products: Product[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductSubTabs({
  products, selectedId, onSelect, onAdd, onEdit, onDelete,
}: ProductSubTabsProps) {
  const [editMode, setEditMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true
      setEditMode(true)
    }, 500)
  }, [])

  const handleTouchEnd = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  const handleTouchMove = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex items-center gap-1.5 overflow-x-auto py-3 px-4 -mx-4"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'none',
          touchAction: 'pan-x',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {products.map(p => (
          <div key={p.id} className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                if (didLongPress.current) { e.preventDefault(); return }
                if (editMode) return
                onSelect(p.id)
              }}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 min-h-[44px] flex items-center gap-1.5 ${
                selectedId === p.id
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-secondary hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
            {editMode && (
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <button
                  onClick={() => onEdit(p)}
                  className="w-6 h-6 flex items-center justify-center bg-foreground text-background rounded-full shadow-sm"
                  aria-label="이름 변경"
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="w-6 h-6 flex items-center justify-center bg-destructive text-white rounded-full shadow-sm"
                  aria-label="삭제"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={onAdd}
          className="flex-shrink-0 flex items-center gap-1 px-4 py-2 text-sm font-medium text-secondary border border-border hover:bg-muted cursor-pointer transition-colors min-h-[44px] whitespace-nowrap"
          aria-label="프로덕트 추가"
        >
          <Plus size={14} />
          추가
        </button>
      </div>
      {/* 편집모드 토글 */}
      {products.length > 0 && (
        <button
          onClick={() => setEditMode(!editMode)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center transition-colors cursor-pointer z-10 ${
            editMode
              ? 'bg-foreground text-background rounded-full'
              : 'text-secondary hover:text-foreground'
          }`}
          aria-label={editMode ? '편집 완료' : '프로덕트 편집'}
        >
          {editMode ? <X size={14} /> : <Pencil size={12} />}
        </button>
      )}
    </div>
  )
}
