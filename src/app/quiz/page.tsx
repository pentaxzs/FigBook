'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, Target, TrendingDown } from 'lucide-react'
import { QuizCard } from '@/components/quiz/QuizCard'
import { storage } from '@/lib/storage'
import {
  valueLabel,
  correctLabel,
  questionPrompt,
  questionPath,
  reaction,
} from '@/lib/quiz/format'
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

function randomDirection(): QuizDirection {
  return (['name-to-value', 'value-to-name'] as QuizDirection[])[Math.floor(Math.random() * 2)]
}

function buildQuestions(metrics: Metric[], products: Product[], features: Feature[]): QuizQuestion[] {
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const featureMap = Object.fromEntries(features.map(f => [f.id, f]))
  return shuffle(
    metrics
      .filter(m => productMap[m.product_id])
      .map(m => ({
        metric: m,
        product: productMap[m.product_id],
        feature: featureMap[m.feature_id] ?? UNKNOWN_FEATURE,
        direction: randomDirection(),
      }))
  )
}

/**
 * 보기를 만든다. 값 문제의 보기는 단위까지 붙여서 낸다.
 * 보기들은 서로 다른 지표에서 가져오므로 각자 자기 단위를 달고 와야 한다 —
 * 정답의 단위를 모든 보기에 붙이면 거짓말이 된다.
 */
function generateChoices(question: QuizQuestion, allMetrics: Metric[]): string[] {
  const correct = correctLabel(question)

  const pool = question.direction === 'name-to-value'
    ? [...new Set(allMetrics.map(m => valueLabel(m.value, m.unit)))]
    : [...new Set(allMetrics.map(m => m.name))]

  const wrong = shuffle(pool.filter(v => v !== correct)).slice(0, 3)

  while (wrong.length < 3) {
    wrong.push(question.direction === 'name-to-value' ? '—' : `지표${wrong.length + 1}`)
  }

  return shuffle([correct, ...wrong])
}

export default function QuizPage() {
  const [allMetrics, setAllMetrics] = useState<Metric[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [lastAnswer, setLastAnswer] = useState<AnswerResult | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [questionCount, setQuestionCount] = useState<number | 'all'>('all')
  /** 빈 배열이면 전체 */
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([storage.getMetrics(), storage.getProducts(), storage.getFeatures()]).then(([m, p, f]) => {
      setAllMetrics(m)
      setProducts(p)
      const built = buildQuestions(m, p, f)
      setAllQuestions(built)
      setQuestions(built)
      setLoaded(true)
    })
  }, [])

  /** 프로덕트별 문제 수. 0개인 프로덕트는 고를 수 없게 한다. */
  const countByProduct = useMemo(() => {
    const map = new Map<string, number>()
    for (const q of allQuestions) {
      map.set(q.product.id, (map.get(q.product.id) ?? 0) + 1)
    }
    return map
  }, [allQuestions])

  const pickedQuestions = useMemo(() => {
    if (selectedProducts.length === 0) return allQuestions
    return allQuestions.filter(q => selectedProducts.includes(q.product.id))
  }, [allQuestions, selectedProducts])

  const choices = useMemo(() => {
    if (phase !== 'quiz' || !questions[current]) return []
    return generateChoices(questions[current], allMetrics)
  }, [phase, current, questions, allMetrics])

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const startQuiz = () => {
    const shuffled = shuffle(pickedQuestions.map(qq => ({ ...qq, direction: randomDirection() })))
    const sliced = questionCount === 'all' ? shuffled : shuffled.slice(0, questionCount)
    setQuestions(sliced)
    setCurrent(0)
    setResults([])
    setLastAnswer(null)
    setPhase('quiz')
  }

  const handleAnswer = (answer: string) => {
    const question = questions[current]
    const result: AnswerResult = {
      question,
      userAnswer: answer,
      correct: answer === correctLabel(question),
    }
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

  const handleRestart = () => setPhase('ready')

  if (!loaded) {
    return <div className="px-4 py-16 flex justify-center text-secondary"><p className="text-sm">불러오는 중...</p></div>
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
    const available = pickedQuestions.length
    const selectable = products.filter(p => (countByProduct.get(p.id) ?? 0) > 0)

    return (
      <div className="px-4 py-8 flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary font-mono">퀴즈</p>
          <p className="text-sm text-secondary mt-2">
            {available}개의 지표가 준비되어 있어요
          </p>
        </div>

        {selectable.length > 1 && (
          <div className="w-full">
            <p className="text-sm font-medium text-foreground mb-3">어떤 프로덕트로 풀까요?</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProducts([])}
                aria-pressed={selectedProducts.length === 0}
                className={`px-3 py-2 text-sm font-medium border transition-colors cursor-pointer min-h-[44px] ${
                  selectedProducts.length === 0
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-secondary hover:border-foreground hover:text-foreground'
                }`}
              >
                전체
              </button>
              {selectable.map(p => {
                const on = selectedProducts.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    aria-pressed={on}
                    className={`px-3 py-2 text-sm font-medium border transition-colors cursor-pointer min-h-[44px] ${
                      on
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-secondary hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {p.name}
                    <span className="ml-1.5 font-mono text-xs opacity-70">
                      {countByProduct.get(p.id)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="w-full">
          <p className="text-sm font-medium text-foreground mb-3">몇 문제를 풀까요?</p>
          <div className="grid grid-cols-2 gap-2">
            {COUNT_OPTIONS.filter(n => n <= available).map(n => (
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
              전체 ({available}문제)
            </button>
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={available === 0}
          className="w-full bg-primary text-white py-4 text-base font-semibold cursor-pointer hover:bg-primary/90 transition-colors min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-xs font-mono w-10 text-right">{rate}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {wrongResults.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-destructive" />
              <p className="text-sm font-medium">틀린 문제</p>
            </div>
            <div className="flex flex-col gap-2">
              {/*
                질문을 먼저 적는다. 이전에는 지표 이름과 "정답: ..." 만 있어서
                무엇을 묻는 문제였는지, 무엇의 답이 그 값인지 알 수 없었다.
              */}
              {wrongResults.map((r, i) => (
                <div key={i} className="p-3 border border-destructive/20 bg-destructive/5">
                  <p className="text-xs text-secondary">{questionPath(r.question)}</p>
                  <p className="text-sm font-medium mt-0.5">{questionPrompt(r.question)}</p>
                  <p className="text-xs font-mono mt-1.5">
                    <span className="text-foreground">정답: {correctLabel(r.question)}</span>
                  </p>
                  <p className="text-xs font-mono mt-0.5">
                    {r.userAnswer
                      ? <span className="text-destructive">내 답: {r.userAnswer}</span>
                      : <span className="text-secondary">(건너뜀)</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {score > 0 && (
          <details className="mb-6">
            <summary className="text-sm font-medium cursor-pointer text-secondary hover:text-foreground transition-colors">
              맞은 문제 보기 ({score}개)
            </summary>
            <div className="flex flex-col gap-2 mt-2">
              {results.filter(r => r.correct).map((r, i) => (
                <div key={i} className="p-3 border border-border bg-muted">
                  <p className="text-xs text-secondary">{questionPath(r.question)}</p>
                  <p className="text-sm mt-0.5">
                    {r.question.metric.name} ={' '}
                    <span className="font-mono font-medium">
                      {valueLabel(r.question.metric.value, r.question.metric.unit)}
                    </span>
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
              setQuestions(shuffle(wrongResults.map(r => ({ ...r.question, direction: randomDirection() }))))
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
    const { face, word } = reaction(correct)
    return (
      <div className="px-4 py-4 flex flex-col gap-6">
        <div
          className={`p-6 text-center border ${
            correct ? 'border-border bg-muted' : 'border-destructive/30 bg-destructive/5'
          }`}
        >
          <p className="text-5xl leading-none mb-3 motion-safe:animate-bounce" aria-hidden="true">
            {face}
          </p>
          <p className="text-base font-bold">{word}</p>

          {/* 어떤 문제였는지 같이 보여준다. 정답만 띄우면 무엇의 답인지 모른다. */}
          <p className="text-xs text-secondary mt-3">{questionPath(question)}</p>
          <p className="text-sm font-medium mt-0.5">{questionPrompt(question)}</p>

          {!correct && (
            <>
              <p className="text-sm text-secondary mt-3">
                정답: <span className="font-mono font-bold text-foreground">{correctLabel(question)}</span>
              </p>
              {userAnswer && (
                <p className="text-sm text-destructive mt-1 font-mono">내 답: {userAnswer}</p>
              )}
              {!userAnswer && <p className="text-sm text-secondary mt-1">(건너뜀)</p>}
            </>
          )}
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
