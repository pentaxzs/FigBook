'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Download, Trash2 } from 'lucide-react'
import { storage } from '@/lib/storage'
import type { Settings } from '@/types'

const PROVIDERS: { key: Settings['ai_provider']; label: string }[] = [
  { key: 'gemini', label: 'Gemini' },
  { key: 'openai', label: 'OpenAI' },
  { key: 'anthropic', label: 'Anthropic' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ai_provider: 'openai', api_keys: {} })
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => { storage.getSettings().then(setSettings) }, [])

  const handleSave = async () => {
    await storage.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const [products, metrics] = await Promise.all([storage.getProducts(), storage.getMetrics()])
    const data = JSON.stringify({ products, metrics, exported_at: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metricspad-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = async () => {
    if (!confirm('모든 데이터를 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return
    const [products, metrics] = await Promise.all([
      storage.getProducts(),
      storage.getMetrics(),
    ])
    await Promise.all([
      ...products.map(p => storage.deleteProduct(p.id)),
      ...metrics.map(m => storage.deleteMetric(m.id)),
    ])
    alert('데이터가 초기화됐어요')
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-6">
      <h2 className="text-base font-bold text-foreground">설정</h2>

      {/* AI 제공자 선택 */}
      <section>
        <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">AI 제공자</h3>
        <div className="flex flex-col gap-px bg-border">
          {PROVIDERS.map(p => (
            <label
              key={p.key}
              className="flex items-center gap-3 p-4 bg-surface cursor-pointer hover:bg-muted transition-colors"
            >
              <input
                type="radio"
                name="provider"
                value={p.key}
                checked={settings.ai_provider === p.key}
                onChange={() => setSettings(s => ({ ...s, ai_provider: p.key }))}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm font-medium">{p.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* API 키 (제공자별) */}
      <section>
        <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">API Keys</h3>
        <div className="flex flex-col gap-3">
          {PROVIDERS.map(p => (
            <div key={p.key}>
              <label className="block text-xs font-medium text-secondary mb-1">{p.label}</label>
              <div className="flex items-center border border-border overflow-hidden bg-surface">
                <input
                  type={showKeys[p.key] ? 'text' : 'password'}
                  value={settings.api_keys[p.key] ?? ''}
                  onChange={e => setSettings(s => ({
                    ...s,
                    api_keys: { ...s.api_keys, [p.key]: e.target.value },
                  }))}
                  placeholder={`${p.label} API Key`}
                  className="flex-1 px-4 py-3 text-sm font-mono focus:outline-none min-h-[44px] bg-surface"
                />
                <button
                  onClick={() => setShowKeys(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  aria-label={showKeys[p.key] ? `${p.label} API 키 숨기기` : `${p.label} API 키 보기`}
                  className="px-3 text-secondary hover:text-foreground cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center border-l border-border"
                >
                  {showKeys[p.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-secondary mt-2">API 키는 이 기기에만 저장되며 외부로 전송되지 않아요</p>
        <button
          onClick={handleSave}
          className={`mt-3 w-full py-3 text-sm font-medium cursor-pointer transition-colors min-h-[44px] ${
            saved
              ? 'bg-muted text-foreground border border-border'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {saved ? '저장됐어요!' : '저장'}
        </button>
      </section>

      {/* 데이터 관리 */}
      <section>
        <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">데이터 관리</h3>
        <div className="flex flex-col gap-px bg-border">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 p-4 bg-surface text-sm font-medium cursor-pointer hover:bg-muted transition-colors min-h-[44px]"
          >
            <Download size={16} className="text-secondary" />
            전체 내보내기 (JSON)
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-3 p-4 bg-surface text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/10 transition-colors min-h-[44px]"
          >
            <Trash2 size={16} />
            전체 초기화
          </button>
        </div>
      </section>
    </div>
  )
}
