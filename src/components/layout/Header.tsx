'use client'

import { useState, useEffect } from 'react'

const PIG_EMOJIS = ['🐷', '🐽', '🐖']

export function Header() {
  const [pig, setPig] = useState('🐷')
  useEffect(() => {
    setPig(PIG_EMOJIS[Math.floor(Math.random() * PIG_EMOJIS.length)])
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="flex items-center h-14 max-w-lg mx-auto px-4">
        <a href="/" className="text-lg font-bold text-black font-sans tracking-tight hover:opacity-80 transition-opacity">
          {pig} FigBook
        </a>
      </div>
    </header>
  )
}
