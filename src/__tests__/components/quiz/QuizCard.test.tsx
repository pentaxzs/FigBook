import { render, screen, fireEvent } from '@testing-library/react'
import { QuizCard } from '@/components/quiz/QuizCard'
import type { QuizQuestion } from '@/types'

const baseMetric = {
  id: 'm1', user_id: 'local', product_id: 'p1', feature_id: 'f1',
  name: 'MAU', value: '150000', unit: '명',
  category: [], memo: '', base_date: '2025-03',
  is_pinned: false, created_at: '',
}

const nameToValue: QuizQuestion = {
  metric: baseMetric,
  product: { id: 'p1', user_id: 'local', name: '카드앱', order: 0, created_at: '' },
  feature: { id: 'f1', user_id: 'local', product_id: 'p1', name: '홈화면 배너', order: 0, created_at: '' },
  direction: 'name-to-value',
}

const valueToName: QuizQuestion = { ...nameToValue, direction: 'value-to-name' }

const choices = ['150,000 명', '1,380,000 클릭', '42 %', '7 건']

describe('QuizCard', () => {
  it('name-to-value: 지표명과 질문을 보여준다', () => {
    render(
      <QuizCard question={nameToValue} choices={choices} onAnswer={jest.fn()} onSkip={jest.fn()} current={1} total={10} />
    )
    expect(screen.getByText('MAU')).toBeInTheDocument()
    expect(screen.getByText('"MAU"의 값은?')).toBeInTheDocument()
  })

  it('프로덕트 › 기능 경로를 보여준다', () => {
    render(
      <QuizCard question={nameToValue} choices={choices} onAnswer={jest.fn()} onSkip={jest.fn()} current={1} total={10} />
    )
    expect(screen.getByText('카드앱 › 홈화면 배너')).toBeInTheDocument()
  })

  it('보기에 단위가 함께 보인다', () => {
    // 숫자만 보여주면 %인지 명인지 클릭인지 알 수 없다
    render(
      <QuizCard question={nameToValue} choices={choices} onAnswer={jest.fn()} onSkip={jest.fn()} current={1} total={10} />
    )
    expect(screen.getByText('150,000 명')).toBeInTheDocument()
    expect(screen.getByText('1,380,000 클릭')).toBeInTheDocument()
    expect(screen.getByText('42 %')).toBeInTheDocument()
  })

  it('value-to-name: 값과 단위로 묻는다', () => {
    render(
      <QuizCard question={valueToName} choices={['MAU', 'DAU']} onAnswer={jest.fn()} onSkip={jest.fn()} current={1} total={10} />
    )
    expect(screen.getByText('"150,000 명"인 지표는?')).toBeInTheDocument()
  })

  it('보기를 고르면 그 표기 그대로 onAnswer 를 부른다', () => {
    const onAnswer = jest.fn()
    render(
      <QuizCard question={nameToValue} choices={choices} onAnswer={onAnswer} onSkip={jest.fn()} current={1} total={10} />
    )
    fireEvent.click(screen.getByText('150,000 명'))
    expect(onAnswer).toHaveBeenCalledWith('150,000 명')
  })

  it('모르겠어요를 누르면 onSkip 을 부른다', () => {
    const onSkip = jest.fn()
    render(
      <QuizCard question={nameToValue} choices={choices} onAnswer={jest.fn()} onSkip={onSkip} current={1} total={10} />
    )
    fireEvent.click(screen.getByText('모르겠어요'))
    expect(onSkip).toHaveBeenCalled()
  })
})
