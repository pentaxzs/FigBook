'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils/uuid'
import type { Product } from '@/types'

interface ProductComboboxProps {
  products: Product[]
  value: string        // selected product_id
  onChange: (productId: string) => void
  onProductCreated: (product: Product) => void  // called when a new product is created
}

export function ProductCombobox({ products, value, onChange, onProductCreated }: ProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedProduct = products.find(p => p.id === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setInputText('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = inputText
    ? products.filter(p => p.name.toLowerCase().includes(inputText.toLowerCase()))
    : products

  const exactMatch = products.some(p => p.name.toLowerCase() === inputText.toLowerCase())
  const showCreateOption = inputText.trim() !== '' && !exactMatch

  const handleSelect = (product: Product) => {
    onChange(product.id)
    setOpen(false)
    setInputText('')
  }

  const handleCreate = async () => {
    const name = inputText.trim()
    if (!name) return
    const newProduct: Product = {
      id: generateId(),
      user_id: 'local',
      name,
      order: products.length,
      created_at: new Date().toISOString(),
    }
    await storage.saveProduct(newProduct)
    onProductCreated(newProduct)
    onChange(newProduct.id)
    setOpen(false)
    setInputText('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm min-h-[44px] flex items-center justify-between bg-white"
      >
        <span className={selectedProduct ? 'text-foreground' : 'text-gray-400'}>
          {selectedProduct ? selectedProduct.name : '프로덕트 선택'}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {/* Filter input */}
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="검색 또는 새로 만들기..."
            className="w-full px-3 py-2 text-sm border-b border-border focus:outline-none"
            autoFocus
          />

          {/* Product options */}
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`px-3 py-2.5 text-sm hover:bg-muted cursor-pointer ${
                p.id === value ? 'bg-muted font-medium' : ''
              }`}
            >
              {p.name}
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && !showCreateOption && (
            <div className="px-3 py-2.5 text-sm text-gray-400">
              검색 결과 없음
            </div>
          )}

          {/* Create option */}
          {showCreateOption && (
            <div
              onClick={handleCreate}
              className="px-3 py-2.5 text-sm text-primary flex items-center gap-2 hover:bg-muted cursor-pointer border-t border-border"
            >
              <Plus size={14} />
              &ldquo;{inputText}&rdquo; 새 프로덕트로 추가
            </div>
          )}
        </div>
      )}
    </div>
  )
}
