import type { QuizQuestion } from '@/types'

/**
 * 퀴즈의 표기 규칙을 한 곳에 모은다.
 *
 * 이전에는 같은 포맷 로직이 QuizCard, 정답 화면, 결과 요약 세 곳에
 * 따로 있었다. 그래서 단위가 어디서는 붙고 어디서는 빠졌고,
 * 결과 요약에는 질문이 아예 없어 "무엇의 답이 로그인 횟수인지"를
 * 알 수 없었다.
 */

export function formatNumber(str: string): string {
  const num = Number(str.replace(/,/g, ''))
  if (isNaN(num) || !isFinite(num)) return str
  return num.toLocaleString('ko-KR')
}

/**
 * 값에 단위를 붙인다. 1380000 만 보여주면 %인지 명인지 클릭인지 알 수 없다.
 * 보기들은 서로 다른 지표에서 가져오므로 각 보기가 자기 단위를 달고 다닌다.
 */
export function valueLabel(value: string, unit?: string): string {
  const n = formatNumber(value)
  return unit ? `${n} ${unit}` : n
}

/** 그 문제에서 맞아야 하는 답. 보기와 같은 표기를 쓴다. */
export function correctLabel(q: QuizQuestion): string {
  return q.direction === 'name-to-value'
    ? valueLabel(q.metric.value, q.metric.unit)
    : q.metric.name
}

/** 화면에 띄우는 질문. 정답 화면과 결과 요약도 이걸 그대로 쓴다. */
export function questionPrompt(q: QuizQuestion): string {
  return q.direction === 'name-to-value'
    ? `"${q.metric.name}"의 값은?`
    : `"${valueLabel(q.metric.value, q.metric.unit)}"인 지표는?`
}

/** 프로덕트 › 기능 경로. 어느 맥락의 문제였는지 알려준다. */
export function questionPath(q: QuizQuestion): string {
  return `${q.product.name} › ${q.feature.name}`
}

const CORRECT_FACES = ['🎉', '✨', '👏', '🙌', '💯', '🔥', '😎', '🥳', '⭐️', '🍀']
const WRONG_FACES = ['🙈', '😅', '🤔', '😵‍💫', '🫠', '😬', '🥲', '👻']
const CORRECT_WORDS = ['정답!', '맞혔어요!', '좋아요!', '그렇죠!', '바로 그거예요!']
const WRONG_WORDS = ['아쉬워요', '한 끗 차이', '다음엔 맞혀요', '이건 어렵죠', '기억해둬요']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function reaction(correct: boolean): { face: string; word: string } {
  return correct
    ? { face: pick(CORRECT_FACES), word: pick(CORRECT_WORDS) }
    : { face: pick(WRONG_FACES), word: pick(WRONG_WORDS) }
}
