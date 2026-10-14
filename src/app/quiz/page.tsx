'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, Target, TrendingDown } from 'lucide-react'
import { QuizCard } from '@/components/quiz/QuizCard'
import { storage } from '@/lib/storage'
import type { Metric, Product, Feature, QuizQuestion, QuizDirection } from '@/types'

type Phase = 'ready' | 'quiz' | 'answer' | 'done'

interface AnswerResult {
  question: QuizQuestion
  userAnswer: string
  correct: boolean
}

const UNKNOWN_FEATURE: Feature = { id: '', user_id: '', product_id: '', name: '알 수 없음', order: 0, created_at: '' }
const COUNT_OPTIONS = [5, 10, 20] as const

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(metrics: Metric[], products: Product[], features: Feature[]): QuizQuestion[] {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))
  const directions: QuizDirection[] = ['name-to-value', 'value-to-name']
  return shuffle(
    metrics
      .filter(m => productMap[m.product_id])
      .map(m => ({
        metric: m,
        product: productMap[m.product_id],
        feature: featureMap[m.feature_id] ?? UNKNOWN_FEATURE,
        direction: directions[Math.floor(Math.random() * 2)],
      }))
  )
}

function generateChoices(question: QuizQuestion, allMetrics: Metric[]): string[] {
  const correct = question.direction === 'name-to-value'
    ? question.metric.value
    : question.metric.name

  const pool = question.direction === 'name-to-value'
    ? [...new Set(allMetrics.map(m => m.value))]
    : [...new Set(allMetrics.map(m => m.name))]

  const wrong = shuffle(pool.filter(v => v !== correct)).slice(0, 3)

  while (wrong.length < 3) {
    wrong.push(question.direction === 'name-to-value' ? '—' : `지표${wrong.length + 1}`)
  }

  return shuffle([correct, ...wrong])
}

function isCorrect(question: QuizQuestion, answer: string): boolean {
  const target = question.direction === 'name-to-value'
    ? question.metric.value
    : question.metric.name
  return answer === target
}

export default function QuizPage() {
  const [allMetrics, setAllMetrics] = useState<Metric[]>([])
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [questionCount, setQuestionCount] = useState<number | 'all'>('all')

  useEffect(() => {
    Promise.all([storage.getMetrics(), storage.getProducts(), storage.getFeatures()]).then(([m, p, f]) => {
      setAllMetrics(m)
      const built = buildQuestions(m, p, f)
      setAllQuestions(built)
      setQuestions(built)
    })
  }, [])

  const choices = useMemo(() => {
    if (phase !== 'quiz' || !questions[current]) return []
    return generateChoices(questions[current], allMetrics)
  }, [phase, current, questions, allMetrics])

  const startQuiz = () => {
    const shuffled = shuffle([...allQuestions].map(qq => ({
      ...qq,
      direction: (['name-to-value', 'value-to-name'] as QuizDirection[])[Math.floor(Math.random() * 2)],
    })))
    const sliced = questionCount === 'all' ? shuffled : shuffled.slice(0, questionCount)
    setQuestions(sliced)
    setCurrent(0)
    setResults([])
    setLastAnswer(null)
    setPhase('quiz')
  }

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
    setPhase('ready')
  }

  if (allQuestions.length === 0) {
    return (
      <div className="px-4 py-16 flex flex-col items-center text-secondary">
        <p className="text-sm">퀴즈를 위한 지표가 없어요</p>
        <p className="text-xs mt-1">홈에서 지표를 추가해보세요</p>
      </div>
    )
  }

  if (phase === 'ready') {
    const total = allQuestions.length
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary font-mono">퀴즈</p>
          <p className="text-sm text-secondary mt-2">총 {total}개의 지표가 준비되어 있어요</p>
        </div>

        <div className="w-full">
          <p className="text-sm font-medium text-foreground mb-3">몇 문제를 풀까요?</p>
          <div className="grid grid-cols-2 gap-2">
            {COUNT_OPTIONS.filter(n => n <= total).map(n => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`py-3 text-sm font-medium border transition-colors cursor-pointer min-h-[48px] ${
                  questionCount === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-secondary hover:border-foreground hover:text-foreground'
                }`}
              >
                {n}문제
              </button>
            ))}
            <button
              onClick={() => setQuestionCount('all')}
              className={`py-3 text-sm font-medium border transition-colors cursor-pointer min-h-[48px] ${
                questionCount === 'all'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-secondary hover:border-foreground hover:text-foreground'
              }`}
            >
              전체 ({total}문제)
            </button>
          </div>
        </div>

        <button
          onClick={startQuiz}
          className="w-full bg-primary text-white py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors min-h-[56px]"
        >
          시작하기
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const score = results.filter(r => r.correct).length
    const total = results.length
    const pct = Math.round((score / total) * 100)
    const skipped = results.filter(r => !r.correct && !r.userAnswer).length
    const wrong = total - score - skipped

    const productStats = new Map<string, { correct: number; total: number; name: string }>()
    for (const r of results) {
      const pid = r.question.product.id
      const stat = productStats.get(pid) ?? { correct: 0, total: 0, name: r.question.product.name }
      stat.total++
      if (r.correct) stat.correct++
      productStats.set(pid, stat)
    }
    const statEntries = [...productStats.values()].sort((a, b) => (a.correct / a.total) - (b.correct / b.total))

    const wrongResults = results.filter(r => !r.correct)

    return (
      <div className="px-4 py-8">
        {/* Score */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary mb-4">
            <span className="text-3xl font-bold font-mono text-primary">{pct}%</span>
          </div>
          <p className="text-lg font-bold">
            {score === total ? '완벽해요!' : pct >= 80 ? '잘 했어요!' : pct >= 50 ? '조금 더 연습해봐요' : '다시 도전해봐요'}
          </p>
          <p className="text-sm text-secondary mt-1">
            {total}문제 중 {score}문제 정답
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center p-3 bg-muted">
            <Check size={16} className="text-foreground mb-1" />
            <span className="text-lg font-bold font-mono">{score}</span>
            <span className="text-xs text-secondary">정답</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-destructive/5">
            <X size={16} className="text-destructive mb-1" />
            <span className="text-lg font-bold font-mono">{wrong}</span>
            <span className="text-xs text-secondary">오답</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-muted">
            <Target size={16} className="text-secondary mb-1" />
            <span className="text-lg font-bold font-mono">{skipped}</span>
            <span className="text-xs text-secondary">건너뜀</span>
          </div>
        </div>

        {/* Product breakdown */}
        {statEntries.length > 1 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">프로덕트별 정답률</p>
            <div className="flex flex-col gap-2">
              {statEntries.map(s => {
                const rate = Math.round((s.correct / s.total) * 100)
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs text-secondary w-20 truncate shrink-0">{s.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-10 text-right">{rate}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Weak areas */}
        {wrongResults.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-destructive" />
              <p className="text-sm font-medium">틀린 문제</p>
            </div>
            <div className="flex flex-col gap-2">
              {wrongResults.map((r, i) => (
                <div key={i} className="p-3 border border-destructive/20 bg-destructive/5">
                  <p className="text-xs text-secondary">{r.question.product.name} › {r.question.feature.name}</p>
                  <p className="text-sm font-medium mt-0.5">{r.question.metric.name}</p>
                  <p className="text-xs font-mono mt-1">
                    <span className="text-foreground">정답: {r.question.direction === 'name-to-value' ? r.question.metric.value : r.question.metric.name}</span>
                    {r.userAnswer && <span className="text-destructive ml-2">내 답: {r.userAnswer}</span>}
                    {!r.userAnswer && <span className="text-secondary ml-2">(건너뜀)</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct list (collapsed) */}
        {score > 0 && (
          <details className="mb-6">
            <summary className="text-sm font-medium cursor-pointer text-secondary hover:text-foreground transition-colors">
              맞은 문제 보기 ({score}개)
            </summary>
            <div className="flex flex-col gap-2 mt-2">
              {results.filter(r => r.correct).map((r, i) => (
                <div key={i} className="p-3 border border-border bg-muted">
                  <p className="text-xs text-secondary">{r.question.product.name} › {r.question.feature.name}</p>
                  <p className="text-sm mt-0.5">
                    {r.question.metric.name} = <span className="font-mono font-medium">{r.question.metric.value}</span>
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="flex-1 border border-border py-4 text-base font-semibold cursor-pointer hover:bg-muted transition-colors"
          >
            처음으로
          </button>
          <button
            onClick={() => {
              const wrongQs = wrongResults.map(r => ({
                ...r.question,
                direction: (['name-to-value', 'value-to-name'] as QuizDirection[])[Math.floor(Math.random() * 2)],
              }))
              setQuestions(shuffle(wrongQs))
              setCurrent(0)
              setResults([])
              setLastAnswer(null)
              setPhase('quiz')
            }}
            disabled={wrongResults.length === 0}
            className="flex-1 bg-primary text-white py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            틀린 문제 다시 풀기
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'answer' && lastAnswer) {
    const { question, userAnswer, correct } = lastAnswer
    const correctAnswer = question.direction === 'name-to-value' ? question.metric.value : question.metric.name
    return (
      <div className="px-4 py-4 flex flex-col gap-6">
        <div className={`p-6 text-center border ${correct ? 'border-border bg-muted' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex justify-center mb-2">
            {correct
              ? <Check size={20} className="text-foreground" />
              : <X size={20} className="text-destructive" />
            }
          </div>
          <p className="text-base font-bold">{correct ? '정답!' : '오답'}</p>
          {!correct && <p className="text-sm text-secondary mt-2">정답: <span className="font-mono font-bold text-foreground">{correctAnswer}</span></p>}
          {!correct && userAnswer && <p className="text-sm text-destructive mt-1">내 답: {userAnswer}</p>}
        </div>
        <button
          onClick={handleNext}
          className="w-full bg-primary text-white py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
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
        choices={choices}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
        current={current + 1}
        total={questions.length}
      />
    </div>
  )
}
