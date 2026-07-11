import { render, screen, fireEvent } from '@testing-library/react'
import { QuizCard } from '@/components/quiz/QuizCard'
import type { QuizQuestion } from '@/types'

const question: QuizQuestion = {
  metric: {
    id: 'm1', user_id: 'local', product_id: 'p1',
    name: 'MAU', value: '15만', unit: '명',
    category: [], memo: '', base_date: '2025-03',
    is_pinned: false, created_at: '',
  },
  product: {
    id: 'p1', user_id: 'local', name: '카드앱', order: 0, created_at: '',
  },
  direction: 'name-to-value',
}

describe('QuizCard', () => {
  it('name-to-value: 지표명 보여주고 값 입력 유도', () => {
    render(<QuizCard question={question} onAnswer={jest.fn()} onSkip={jest.fn()} current={1} total={10} />)
    expect(screen.getByText('MAU')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('값을 입력하세요')).toBeInTheDocument()
  })

  it('확인 버튼 클릭 시 onAnswer 호출', () => {
    const onAnswer = jest.fn()
    render(<QuizCard question={question} onAnswer={onAnswer} onSkip={jest.fn()} current={1} total={10} />)
    fireEvent.change(screen.getByPlaceholderText('값을 입력하세요'), { target: { value: '15만' } })
    fireEvent.click(screen.getByText('확인'))
    expect(onAnswer).toHaveBeenCalledWith('15만')
  })

  it('건너뛰기 버튼 클릭 시 onSkip 호출', () => {
    const onSkip = jest.fn()
    render(<QuizCard question={question} onAnswer={jest.fn()} onSkip={onSkip} current={1} total={10} />)
    fireEvent.click(screen.getByText('건너뛰기'))
    expect(onSkip).toHaveBeenCalled()
  })
})
