'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Brain, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/search', icon: Search, label: '검색' },
  { href: '/quiz', icon: Brain, label: '퀴즈' },
  { href: '/settings', icon: Settings, label: '설정' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg min-w-[44px] min-h-[44px] justify-center cursor-pointer transition-colors duration-150 ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-primary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
