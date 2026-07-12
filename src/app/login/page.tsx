'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setError('코드가 올바르지 않거나 만료되었어요.')
    } else {
      window.location.replace('/')
    }
  }

  return (
    <div className="-mt-14 -mb-20 h-dvh bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold font-mono mb-1 text-foreground">🐿️ Metrics Pad</h1>
        <p className="text-sm text-secondary mb-8">프로덕트 지표를 기록하고 팔로업하세요</p>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              className="w-full border border-border px-4 py-3 text-base focus:outline-none focus:border-primary bg-surface min-h-[44px]"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-primary text-white py-3 text-sm font-medium disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {loading ? '전송 중...' : '인증 코드 받기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <p className="text-xs text-secondary">
              <span className="font-mono">{email}</span>로 6자리 코드를 보냈어요
            </p>
            <input
              type="number"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="6자리 코드 입력"
              maxLength={6}
              required
              className="w-full border border-border px-4 py-3 text-base focus:outline-none focus:border-primary bg-surface min-h-[44px] font-mono tracking-widest"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.trim().length < 6}
              className="w-full bg-primary text-white py-3 text-sm font-medium disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              {loading ? '확인 중...' : '로그인'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="text-xs text-secondary text-center py-2 cursor-pointer"
            >
              이메일 다시 입력
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
