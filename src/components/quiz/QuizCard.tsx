'use client'

import type { QuizQuestion } from '@/types'

interface QuizCardProps {
  question: QuizQuestion
  choices: string[]
  onAnswer: (answer: string) => void
  onSkip: () => void
  current: number
  total: number
}

export function QuizCard({ question, choices, onAnswer, onSkip, current, total }: QuizCardProps) {
  const { metric, product, feature, direction } = question

  const prompt = direction === 'name-to-value'
    ? `"${metric.name}"의 값은?`
    : `값이 "${metric.value}${metric.unit ? ' ' + metric.unit : ''}"인 지표는?`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted border border-border h-2">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
        <span className="text-sm text-secondary font-mono">{current} / {total}</span>
      </div>

      <div className="bg-surface border border-border p-6 min-h-[160px] flex flex-col justify-center">
        <p className="text-[10px] text-secondary mb-2">{product.name} › {feature.name}</p>
        {direction === 'name-to-value' && (
          <p className="text-xl font-bold text-foreground mb-1">{metric.name}</p>
        )}
        <p className="text-base font-semibold text-foreground">{prompt}</p>
        {metric.base_date && (
          <p className="text-xs text-secondary mt-2 font-mono">기준: {metric.base_date}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => onAnswer(choice)}
            className="w-full text-left border border-border px-4 py-3.5 text-sm font-medium bg-surface hover:bg-muted active:bg-primary/10 cursor-pointer transition-colors min-h-[48px] flex items-center gap-3"
          >
            <span className="w-6 h-6 flex items-center justify-center border border-border text-xs text-secondary font-mono shrink-0">
              {i + 1}
            </span>
            <span className="font-mono">{choice}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="w-full py-3 text-sm font-medium text-secondary hover:bg-muted cursor-pointer transition-colors min-h-[44px]"
      >
        모르겠어요
      </button>
    </div>
  )
}
