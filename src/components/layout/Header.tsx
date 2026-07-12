'use client'

import { useState, useEffect } from 'react'
import { LayoutList, LayoutGrid } from 'lucide-react'

type ViewMode = 'list' | 'grid'

interface HeaderProps {
  view: ViewMode
  onToggleView: (v: ViewMode) => void
}

const PIG_EMOJIS = ['🐷', '🐽', '🐖']

export function Header({ view, onToggleView }: HeaderProps) {
  const [pig, setPig] = useState('🐷')
  useEffect(() => {
    setPig(PIG_EMOJIS[Math.floor(Math.random() * PIG_EMOJIS.length)])
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        <a href="/" className="text-lg font-bold text-black font-sans tracking-tight hover:opacity-80 transition-opacity">
          {pig} FigBook
        </a>
        <div className="flex border border-border">
          <button onClick={() => onToggleView('list')} aria-label="리스트 보기"
            className={`px-2.5 py-1.5 transition-colors cursor-pointer border-r border-border ${view === 'list' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
            <LayoutList size={14} />
          </button>
          <button onClick={() => onToggleView('grid')} aria-label="그리드 보기"
            className={`px-2.5 py-1.5 transition-colors cursor-pointer ${view === 'grid' ? 'bg-foreground text-background' : 'bg-surface text-secondary hover:text-foreground'}`}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
