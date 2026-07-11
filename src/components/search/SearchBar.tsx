'use client'

import { Search } from 'lucide-react'
import type { Product } from '@/types'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  products: Product[]
  selectedProductId: string
  onProductChange: (id: string) => void
}

export function SearchBar({
  query, onQueryChange, products, selectedProductId, onProductChange,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      <select
        value={selectedProductId}
        onChange={e => onProductChange(e.target.value)}
        className="border-r border-border px-3 py-3 text-sm text-foreground bg-muted focus:outline-none cursor-pointer min-h-[44px]"
      >
        <option value="">전체</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <div className="flex items-center flex-1 px-3">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="지표 검색..."
          className="flex-1 px-2 py-3 text-sm focus:outline-none min-h-[44px]"
          autoFocus
        />
      </div>
    </div>
  )
}
