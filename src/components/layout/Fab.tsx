'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, PenLine, ImagePlus } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Fab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const fabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (pathname !== '/') return null

  const handleDirect = () => {
    setOpen(false)
    window.dispatchEvent(new CustomEvent('metricspad:add'))
  }

  const handleImage = () => {
    setOpen(false)
    window.dispatchEvent(new CustomEvent('metricspad:add-image'))
  }

  return (
    <div ref={fabRef} className="fixed right-4 bottom-20 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 flex flex-col gap-3 items-end" style={{ bottom: 'calc(100% + 16px)' }}>
            <button
              onClick={handleImage}
              className="flex items-center gap-2.5 bg-surface border border-border shadow-lg pl-4 pr-3 py-2.5 rounded-full cursor-pointer hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="text-sm font-medium text-foreground">이미지로 추가</span>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shrink-0">
                <ImagePlus size={15} strokeWidth={1.8} />
              </div>
            </button>
            <button
              onClick={handleDirect}
              className="flex items-center gap-2.5 bg-surface border border-border shadow-lg pl-4 pr-3 py-2.5 rounded-full cursor-pointer hover:bg-muted transition-colors whitespace-nowrap"
            >
              <span className="text-sm font-medium text-foreground">직접 추가</span>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-background shrink-0">
                <PenLine size={15} strokeWidth={1.8} />
              </div>
            </button>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg cursor-pointer transition-all duration-200 ${
          open
            ? 'bg-secondary/20 text-foreground rotate-45'
            : 'bg-foreground text-background'
        }`}
        aria-label={open ? '닫기' : '추가'}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  )
}
