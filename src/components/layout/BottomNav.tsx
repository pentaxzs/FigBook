'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, Brain, Settings } from 'lucide-react'

const LEFT_ITEMS = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/search', icon: Search, label: '검색' },
] as const

const RIGHT_ITEMS = [
  { href: '/quiz', icon: Brain, label: '퀴즈' },
  { href: '/settings', icon: Settings, label: '설정' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return null

  const handleAdd = () => {
    window.dispatchEvent(new CustomEvent('metricspad:add'))
  }

  const renderItem = ({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) => {
    const isActive = pathname === href
    return (
      <Link
        key={href}
        href={href}
        className={`flex flex-col items-center gap-1 py-2 px-4 min-w-[44px] min-h-[44px] justify-center cursor-pointer transition-colors duration-150 ${
          isActive ? 'text-foreground' : 'text-secondary hover:text-foreground'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
        <span className="text-xs font-medium">{label}</span>
      </Link>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {LEFT_ITEMS.map(renderItem)}
        <button
          onClick={handleAdd}
          className="flex flex-col items-center gap-1 py-2 px-4 min-w-[44px] min-h-[44px] justify-center cursor-pointer transition-colors duration-150 text-secondary hover:text-foreground"
          aria-label="추가"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground text-background -mt-4 shadow-md">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-medium -mt-0.5">추가</span>
        </button>
        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>
  )
}
