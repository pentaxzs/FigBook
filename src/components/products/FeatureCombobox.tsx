'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils/uuid'
import type { Feature } from '@/types'

interface FeatureComboboxProps {
  features: Feature[]           // already filtered by product_id from parent
  productId: string
  value: string                 // selected feature_id
  onChange: (featureId: string) => void
  onFeatureCreated: (feature: Feature) => void
  disabled?: boolean            // true when no product selected
}

export function FeatureCombobox({
  features, productId, value, onChange, onFeatureCreated, disabled,
}: FeatureComboboxProps) {
  const [open, setOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedFeature = features.find(f => f.id === value)

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

  if (disabled) {
    return (
      <div className="w-full border border-border rounded-lg px-3 py-2.5 text-sm min-h-[44px] flex items-center bg-muted cursor-not-allowed">
        <span className="text-gray-400">먼저 프로덕트를 선택하세요</span>
      </div>
    )
  }

  const filtered = inputText
    ? features.filter(f => f.name.toLowerCase().includes(inputText.toLowerCase()))
    : features

  const exactMatch = features.some(f => f.name.toLowerCase() === inputText.toLowerCase())
  const showCreateOption = inputText.trim() !== '' && !exactMatch

  const handleSelect = (feature: Feature) => {
    onChange(feature.id)
    setOpen(false)
    setInputText('')
  }

  const handleCreate = async () => {
    const name = inputText.trim()
    if (!name) return
    const newFeature: Feature = {
      id: generateId(),
      user_id: 'local',
      product_id: productId,
      name,
      order: features.length,
      created_at: new Date().toISOString(),
    }
    await storage.saveFeature(newFeature)
    onFeatureCreated(newFeature)
    onChange(newFeature.id)
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
        <span className={selectedFeature ? 'text-foreground' : 'text-gray-400'}>
          {selectedFeature ? selectedFeature.name : '영역/기능 선택'}
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
            className="w-full px-3 py-2 text-base border-b border-border focus:outline-none"
            autoFocus
          />

          {/* Feature options */}
          {filtered.map(f => (
            <div
              key={f.id}
              onClick={() => handleSelect(f)}
              className={`px-3 py-2.5 text-sm hover:bg-muted cursor-pointer ${
                f.id === value ? 'bg-muted font-medium' : ''
              }`}
            >
              {f.name}
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
              + &ldquo;{inputText}&rdquo; 영역/기능으로 추가
            </div>
          )}
        </div>
      )}
    </div>
  )
}
