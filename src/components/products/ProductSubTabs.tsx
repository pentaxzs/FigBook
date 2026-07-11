'use client'

import { useState } from 'react'
import { Plus, MoreVertical } from 'lucide-react'
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
  const [menuId, setMenuId] = useState<string | null>(null)

  return (
    <div className="relative flex items-center gap-2 overflow-x-auto py-2 px-4 -mx-4 scrollbar-hide">
      {products.map(p => (
        <div key={p.id} className="relative flex-shrink-0">
          <button
            onClick={() => onSelect(p.id)}
            onContextMenu={e => { e.preventDefault(); setMenuId(p.id) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 min-h-[44px] ${
              selectedId === p.id
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground hover:bg-border'
            }`}
          >
            {p.name}
          </button>
          {/* 컨텍스트 메뉴 */}
          {menuId === p.id && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuId(null)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-40 min-w-[120px] py-1">
                <button
                  onClick={() => { onEdit(p); setMenuId(null) }}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted cursor-pointer"
                >
                  이름 변경
                </button>
                <button
                  onClick={() => { onDelete(p.id); setMenuId(null) }}
                  className="w-full px-4 py-2.5 text-sm text-left text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-sm text-secondary border border-secondary/30 hover:bg-muted cursor-pointer transition-colors min-h-[44px]"
        aria-label="프로덕트 추가"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
