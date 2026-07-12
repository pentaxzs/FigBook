'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Check, Upload, Loader2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage'
import { createAIProvider } from '@/lib/ai/AIProvider'
import { generateId } from '@/lib/utils/uuid'
import type { ParsedMetric, Product, Metric } from '@/types'

interface ParseResultReviewProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onSaved: () => void
}

export function ParseResultReview({ open, onClose, products, onSaved }: ParseResultReviewProps) {
  const [step, setStep] = useState<'upload' | 'loading' | 'review'>('upload')
  const [parsed, setParsed] = useState<(ParsedMetric & { excluded: boolean })[]>([])
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 지원해요 (PNG, JPG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 해요')
      return
    }

    setStep('loading')
    setError(null)

    try {
      const settings = await storage.getSettings()
      const provider = createAIProvider(settings)
      const base64 = await fileToBase64(file)
      const results = await provider.parseImage(base64, file.type)
      setParsed(results.map(r => ({ ...r, excluded: false })))
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱 오류가 발생했어요')
      setStep('upload')
    }
  }

  const handleSave = async () => {
    const toSave = parsed.filter(p => !p.excluded && p.name && p.value)
    const metrics: Metric[] = toSave.map(p => ({
      id: generateId(),
      user_id: 'local',
      product_id: selectedProductId,
      feature_id: '',
      name: p.name!,
      value: p.value!,
      unit: p.unit ?? '',
      category: [],
      memo: '',
      base_date: p.base_date ?? '',
      is_pinned: false,
      created_at: new Date().toISOString(),
    }))
    for (const m of metrics) await storage.saveMetric(m)
    onSaved()
    onClose()
    setStep('upload')
    setParsed([])
  }

  const content = (
    <div className="flex flex-col gap-4">
      {step === 'upload' && (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">이미지를 선택하거나 드래그하세요</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · 최대 10MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-gray-500">AI가 지표를 추출하고 있어요...</p>
        </div>
      )}

      {step === 'review' && (
        <>
          <p className="text-sm font-medium text-foreground">추출된 지표 {parsed.filter(p => !p.excluded).length}개</p>
          <div className="flex flex-col gap-2">
            {parsed.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  p.excluded ? 'border-border bg-muted opacity-50' : 'border-border bg-white'
                }`}
              >
                <button
                  onClick={() => setParsed(prev => prev.map((item, idx) =>
                    idx === i ? { ...item, excluded: !item.excluded } : item
                  ))}
                  aria-label={p.excluded ? '지표 포함' : '지표 제외'}
                  className={`p-2 rounded-full cursor-pointer transition-colors flex-shrink-0 ${
                    p.excluded ? 'bg-muted text-gray-400' : 'bg-primary text-white'
                  }`}
                >
                  <Check size={12} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name ?? '(이름 없음)'}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {p.value ?? '?'} {p.unit ?? ''} {p.base_date ? `· ${p.base_date}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">저장할 프로덕트</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none min-h-[44px]"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setParsed([]) }}
              className="flex-1 border border-border rounded-lg py-3 text-sm cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
            >
              다시 업로드
            </button>
            <button
              onClick={handleSave}
              disabled={parsed.filter(p => !p.excluded).length === 0}
              className="flex-1 bg-primary text-white rounded-lg py-3 text-sm font-medium cursor-pointer hover:bg-primary/90 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              저장하기
            </button>
          </div>
        </>
      )}
    </div>
  )

  if (!open) return null
  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title="이미지에서 지표 가져오기">
        {content}
      </BottomSheet>
    )
  }
  return (
    <Modal open={open} onClose={onClose} title="이미지에서 지표 가져오기">
      {content}
    </Modal>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
