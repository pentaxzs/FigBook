'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Image } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage/LocalStorageAdapter'
import { generateId } from '@/lib/utils/uuid'
import type { Metric, Product } from '@/types'

interface AddMetricSheetProps {
  open: boolean
  onClose: () => void
  products: Product[]
  editTarget: Metric | null
  onSaved: () => void
  onOpenImageParser: () => void
}

const EMPTY_FORM = {
  product_id: '',
  name: '',
  value: '',
  unit: '',
  base_date: '',
  category: [] as string[],
  memo: '',
}

export function AddMetricSheet({
  open, onClose, products, editTarget, onSaved, onOpenImageParser,
}: AddMetricSheetProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editTarget) {
      setForm({
        product_id: editTarget.product_id,
        name: editTarget.name,
        value: editTarget.value,
        unit: editTarget.unit,
        base_date: editTarget.base_date,
        category: editTarget.category,
        memo: editTarget.memo,
      })
    } else {
      setForm({ ...EMPTY_FORM, product_id: products[0]?.id ?? '' })
    }
  }, [editTarget, products, open])

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !form.category.includes(tag)) {
      setForm(f => ({ ...f, category: [...f.category, tag] }))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, category: f.category.filter(c => c !== tag) }))
  }

  const handleSave = async () => {
    if (!form.name || !form.value || !form.product_id) return
    setSaving(true)
    try {
      if (editTarget) {
        await storage.updateMetric(editTarget.id, {
          ...form,
          is_pinned: editTarget.is_pinned,
        })
      } else {
        const metric: Metric = {
          id: generateId(),
          user_id: 'local',
          is_pinned: false,
          created_at: new Date().toISOString(),
          ...form,
        }
        await storage.saveMetric(metric)
      }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const formContent = (
    <div className="flex flex-col gap-4">
      {/* 프로덕트 선택 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">프로덕트</label>
        <select
          value={form.product_id}
          onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
        >
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* 지표명 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          지표명 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="MAU, 클릭률, DAU..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
        />
      </div>

      {/* 값 + 단위 */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            값 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            placeholder="15만, 3.2"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-gray-600 mb-1">단위</label>
          <input
            type="text"
            value={form.unit}
            onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
            placeholder="명, %"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>
      </div>

      {/* 기준날짜 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">기준 날짜</label>
        <input
          type="month"
          value={form.base_date}
          onChange={e => setForm(f => ({ ...f, base_date: e.target.value }))}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
        />
      </div>

      {/* 카테고리 태그 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.category.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs bg-muted text-secondary px-2 py-1 rounded-full"
            >
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive cursor-pointer">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="retention, engagement..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
          <button
            onClick={addTag}
            className="px-3 py-2 bg-muted text-secondary rounded-lg cursor-pointer hover:bg-border transition-colors min-h-[44px]"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
        <textarea
          value={form.memo}
          onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
          placeholder="Q1 기준, 전월 대비 +12%..."
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* 이미지에서 가져오기 */}
      <button
        onClick={onOpenImageParser}
        className="flex items-center gap-2 text-sm text-secondary border border-secondary/30 rounded-lg px-4 py-3 hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
      >
        <Image size={16} />
        이미지에서 지표 가져오기
      </button>

      {/* 저장/취소 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 border border-border rounded-lg py-3 text-sm font-medium text-gray-600 hover:bg-muted cursor-pointer transition-colors min-h-[44px]"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.name || !form.value || !form.product_id}
          className="flex-1 bg-primary text-white rounded-lg py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors min-h-[44px]"
        >
          {saving ? '저장 중...' : editTarget ? '수정' : '저장'}
        </button>
      </div>
    </div>
  )

  const title = editTarget ? '지표 수정' : '지표 추가'

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={title}>
        {formContent}
      </BottomSheet>
      <Modal open={open} onClose={onClose} title={title}>
        {formContent}
      </Modal>
    </>
  )
}
