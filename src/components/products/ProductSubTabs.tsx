'use client'

import { useRef, useEffect } from 'react'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'
import type { Product } from '@/types'

interface ProductSubTabsProps {
  products: Product[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ProductSubTabs({
  products, selectedId, onSelect,
}: ProductSubTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // 선택된 탭이 보이도록 스크롤
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = selectedRef.current
      const left = el.offsetLeft - container.offsetLeft - 16
      container.scrollTo({ left, behavior: 'smooth' })
    }
  }, [selectedId])

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto py-2 px-4 -mx-4"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        scrollbarWidth: 'none',
      }}
    >
      {products.map(p => (
        <button
          key={p.id}
          ref={selectedId === p.id ? selectedRef : undefined}
          onClick={() => onSelect(p.id)}
          className={`flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 min-h-[44px] ${
            selectedId === p.id
              ? 'bg-foreground text-background'
              : 'bg-muted text-secondary hover:text-foreground'
          }`}
        >
          {p.name}
        </button>
      ))}
      <Link
        href="/products"
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-sm font-medium text-secondary hover:text-foreground hover:bg-muted cursor-pointer transition-colors min-h-[44px] whitespace-nowrap"
        aria-label="프로덕트 관리"
      >
        <Settings2 size={14} />
        관리
      </Link>
    </div>
  )
}
