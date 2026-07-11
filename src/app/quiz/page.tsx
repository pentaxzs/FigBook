'use client'

import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { QuizCard } from '@/components/quiz/QuizCard'
import { storage } from '@/lib/storage/LocalStorageAdapter'
import type { Metric, Product, Feature, QuizQuestion, QuizDirection } from '@/types'

type Phase = 'ready' | 'quiz' | 'answer' | 'done'

interface AnswerResult {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
}

const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }

function buildQuestions(metrics: Metric[], products: Product[], features: Feature[]): QuizQuestion[] {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))
  const directions: QuizDirection[] = ['name-to-value', 'value-to-name']
  return metrics
    .filter(m => productMap[m.product_id])
    .map(m => ({
      metric: m,
      product: productMap[m.product_id],
      feature: featureMap[m.feature_id] ?? UNKNOWN_FEATURE,
      direction: directions[Math.floor(Math.random() * 2)],
    }))
    .sort(() => Math.random() - 0.5)
}

function isCorrect(question: QuizQuestion, answer: string): boolean {
  const target = question.direction === 'name-to-value'
    ? question.metric.value
    : question.metric.name
  return answer.trim().toLowerCase() === target.trim().toLowerCase()
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])

  useEffect(() => {
    Promise.all([storage.getMetrics(), storage.getProducts(), storage.getFeatures()]).then(([m, p, f]) => {
      setQuestions(buildQuestions(m, p, f))
    })
  }, [])

  const handleAnswer = (answer: string) => {
    const question = questions[current]
    const result: AnswerResult = { question, userAnswer: answer, correct: isCorrect(question, answer) }
    setLastAnswer(result)
    setResults(prev => [...prev, result])
    setPhase('answer')
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setPhase('done')
    } else {
      setCurrent(c => c + 1)
      setPhase('quiz')
      setLastAnswer(null)
    }
  }

  const handleSkip = () => {
    const question = questions[current]
    setResults(prev => [...prev, { question, userAnswer: '', correct: false }])
    handleNext()
  }

  const handleRestart = () => {
    setCurrent(0)
    setPhase('quiz')
    setResults([])
    setLastAnswer(null)
    setQuestions(q => [...q].sort(() => Math.random() - 0.5))
  }

  if (questions.length === 0) {
    return (
      <div className="px-4 py-16 flex flex-col items-center text-gray-400">
        <p className="text-sm">퀴즈를 위한 지표가 없어요</p>
        <p className="text-xs mt-1">홈에서 지표를 추가해보세요</p>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary font-mono">퀴즈</p>
          <p className="text-sm text-gray-500 mt-2">총 {questions.length}개의 지표로 연습해요</p>
        </div>
        <button
          onClick={() => setPhase('quiz')}
          className="w-full bg-primary text-white rounded-2xl py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors min-h-[56px]"
        >
          시작하기
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const score = results.filter(r => r.correct).length
    return (
      <div className="px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-4xl font-bold font-mono text-primary">{score}<span className="text-2xl text-gray-400">/{results.length}</span></p>
          <p className="text-base font-semibold mt-2">
            {score === results.length ? '완벽해요!' : score >= results.length * 0.8 ? '잘 했어요!' : '조금 더 연습해봐요'}
          </p>
        </div>
        <div className="flex flex-col gap-3 mb-8">
          {results.map((r, i) => (
            <div key={i} className={`p-4 rounded-xl border ${r.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs text-gray-500">{r.question.product.name} &gt; {r.question.feature.name} &gt; {r.question.metric.name}</p>
              <p className="text-sm font-mono mt-1">
                정답: <span className="font-bold">{r.question.direction === 'name-to-value' ? r.question.metric.value : r.question.metric.name}</span>
                {!r.correct && r.userAnswer && <span className="text-red-500 ml-2">내 답: {r.userAnswer}</span>}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={handleRestart}
          className="w-full bg-primary text-white rounded-2xl py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
        >
          다시 풀기
        </button>
      </div>
    )
  }

  if (phase === 'answer' && lastAnswer) {
    const { question, userAnswer, correct } = lastAnswer
    const correctAnswer = question.direction === 'name-to-value' ? question.metric.value : question.metric.name
    return (
      <div className="px-4 py-4 flex flex-col gap-6">
        <div className={`p-6 rounded-2xl text-center ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex justify-center mb-2">
            {correct
              ? <Check size={20} className="text-green-600" />
              : <X size={20} className="text-red-500" />
            }
          </div>
          <p className="text-base font-bold">{correct ? '정답!' : '오답'}</p>
          {!correct && <p className="text-sm text-gray-600 mt-2">정답: <span className="font-mono font-bold">{correctAnswer}</span></p>}
          {!correct && userAnswer && <p className="text-sm text-red-500 mt-1">내 답: {userAnswer}</p>}
        </div>
        <button
          onClick={handleNext}
          className="w-full bg-primary text-white rounded-2xl py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
        >
          {current + 1 >= questions.length ? '결과 보기' : '다음 문제'}
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <QuizCard
        question={questions[current]}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
        current={current + 1}
        total={questions.length}
      />
    </div>
  )
}
