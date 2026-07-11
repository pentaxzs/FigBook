'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  fullScreen?: boolean
  footer?: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children, fullScreen, footer }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col md:hidden">
        {/* 딤 */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        {/* 시트 */}
        <div className="relative bg-white h-dvh flex flex-col rounded-t-none">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-white">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-muted cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
          {/* 스크롤 가능한 컨텐츠 */}
          <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
          {/* 푸터 */}
          {footer && (
            <div className="border-t border-border bg-white px-4 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* 딤 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* 시트 */}
      <div className="relative bg-white rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-muted cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
