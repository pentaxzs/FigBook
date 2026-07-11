import { render, screen, fireEvent } from '@testing-library/react'
import { MetricCard } from '@/components/metrics/MetricCard'
import type { Metric, Product, Feature } from '@/types'

const product: Product = {
  id: 'p1', user_id: 'local', name: '카드앱', order: 0, created_at: '',
}

const feature: Feature = {
  id: 'f1', user_id: 'local', product_id: 'p1', name: '홈화면 배너', order: 0, created_at: '',
}

const metric: Metric = {
  id: 'm1', user_id: 'local', product_id: 'p1', feature_id: 'f1',
  name: 'MAU', value: '15만', unit: '명',
  category: ['retention'], memo: 'Q1 기준',
  base_date: '2025-03', is_pinned: false, created_at: '',
}

describe('MetricCard', () => {
  it('지표 이름과 값을 렌더링한다', () => {
    render(
      <MetricCard
        metric={metric}
        product={product}
        feature={feature}
        onEdit={jest.fn()}
        onTogglePin={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('MAU')).toBeInTheDocument()
    expect(screen.getByText('15만')).toBeInTheDocument()
    expect(screen.getByText('명')).toBeInTheDocument()
  })

  it('카테고리 태그를 렌더링한다', () => {
    render(
      <MetricCard
        metric={metric}
        product={product}
        feature={feature}
        onEdit={jest.fn()}
        onTogglePin={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByText('#retention')).toBeInTheDocument()
  })

  it('편집 버튼 클릭 시 onEdit 호출', () => {
    const onEdit = jest.fn()
    render(
      <MetricCard
        metric={metric}
        product={product}
        feature={feature}
        onEdit={onEdit}
        onTogglePin={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('편집'))
    expect(onEdit).toHaveBeenCalledWith(metric)
  })

  it('핀 버튼 클릭 시 onTogglePin 호출', () => {
    const onTogglePin = jest.fn()
    render(
      <MetricCard
        metric={metric}
        product={product}
        feature={feature}
        onEdit={jest.fn()}
        onTogglePin={onTogglePin}
        onDelete={jest.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText('핀 고정'))
    expect(onTogglePin).toHaveBeenCalledWith('m1')
  })

  it('is_pinned true 시 핀 아이콘 활성화 스타일', () => {
    const { container } = render(
      <MetricCard
        metric={{ ...metric, is_pinned: true }}
        product={product}
        feature={feature}
        onEdit={jest.fn()}
        onTogglePin={jest.fn()}
        onDelete={jest.fn()}
      />
    )
    expect(container.querySelector('[data-pinned="true"]')).toBeInTheDocument()
  })
})
