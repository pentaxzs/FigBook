'use client'

import { useState } from 'react'
import type { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  onAnswer: (answer: string) => void
  onSkip: () => void
  current: number
  total: number
}

export function QuizCard({ question, onAnswer, onSkip, current, total }: QuizCardProps) {
  const [input, setInput] = useState('')
  const { metric, product, direction } = question

  const prompt = direction === 'name-to-value'
    ? `${product.name} > ${metric.name} (${metric.base_date}) 의 값은?`
    : `${product.name}에서 값이 "${metric.value} ${metric.unit}" (${metric.base_date}) 인 지표명은?`

  const handleSubmit = () => {
    if (input.trim()) {
      onAnswer(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 진행 상황 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted border border-border h-2">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-secondary font-mono">{current} / {total}</span>
      </div>

      {/* 질문 카드 */}
      <div className="bg-surface border border-border p-6 min-h-[200px] flex flex-col justify-center">
        <p className="text-xs text-secondary font-medium mb-3">{product.name}</p>
        {direction === 'name-to-value' && (
          <p className="text-xl font-bold text-foreground mb-2">{metric.name}</p>
        )}
        <p className="text-base font-semibold text-foreground mb-1">{prompt}</p>
        {metric.memo && (
          <p className="text-xs text-secondary mt-2">힌트: {metric.memo}</p>
        )}
      </div>

      {/* 입력 */}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="값을 입력하세요"
        className="w-full border border-border px-4 py-3 text-base font-mono focus:outline-none focus:border-primary min-h-[52px] bg-surface"
        autoFocus
      />

      {/* 버튼 */}
      <div className="flex gap-0">
        <button
          onClick={onSkip}
          className="flex-1 border border-border border-r-0 py-3 text-sm font-medium text-secondary hover:bg-muted cursor-pointer transition-colors min-h-[44px]"
        >
          건너뛰기
        </button>
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="flex-1 bg-primary text-white py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors min-h-[44px]"
        >
          확인
        </button>
      </div>
    </div>
  )
}
