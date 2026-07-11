'use client'

import { Plus } from 'lucide-react'

interface HeaderProps {
  onAddMetric: () => void
}

export function Header({ onAddMetric }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">
        <h1 className="text-lg font-bold text-primary font-mono tracking-tight">
          MetricsPad
        </h1>
        <button
          onClick={onAddMetric}
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-3 py-2 rounded-lg min-h-[44px] cursor-pointer hover:bg-primary/90 transition-colors duration-150 active:scale-95"
          aria-label="지표 추가"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden xs:inline sm:inline">지표추가</span>
        </button>
      </div>
    </header>
  )
}
