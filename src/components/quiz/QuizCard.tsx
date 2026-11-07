'use client'

import type { QuizQuestion } from '@/types'
import { questionPrompt, questionPath } from '@/lib/quiz/format'

interface QuizCardProps {
  question: QuizQuestion
  choices: string[]
  onAnswer: (answer: string) => void
  onSkip: () => void
  current: number
  total: number
}

export function QuizCard({ question, choices, onAnswer, onSkip, current, total }: QuizCardProps) {
  const { metric, direction } = question

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
        <p className="text-[10px] text-secondary mb-2">{questionPath(question)}</p>
        {direction === 'name-to-value' && (
          <p className="text-xl font-bold text-foreground mb-1">{metric.name}</p>
        )}
        <p className="text-base font-semibold text-foreground">{questionPrompt(question)}</p>
        {metric.base_date && (
          <p className="text-xs text-secondary mt-2 font-mono">기준: {metric.base_date}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* 보기는 이미 단위까지 붙은 표기로 들어온다 */}
        {choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => onAnswer(choice)}
            className="w-full text-left border border-border px-4 py-3.5 text-sm font-medium bg-surface hover:bg-muted active:bg-primary/10 active:scale-[0.99] cursor-pointer transition-all min-h-[48px] flex items-center gap-3"
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
