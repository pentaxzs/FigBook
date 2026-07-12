'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold font-mono mb-1 text-foreground">🐷 FigBook</h1>
        <p className="text-sm text-secondary mb-8">프로덕트 지표를 기록하고 팔로업하세요</p>

        {sent ? (
          <div className="border border-border p-6 bg-surface">
            <p className="text-sm font-medium text-foreground mb-1">이메일을 확인하세요</p>
            <p className="text-xs text-secondary mt-1">
              <span className="font-mono">{email}</span>로 로그인 링크를 보냈어요.
              링크를 클릭하면 바로 로그인돼요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              autoFocus
              className="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary bg-surface min-h-[44px]"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-primary text-white py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors min-h-[44px]"
            >
              {loading ? '보내는 중...' : '로그인 링크 받기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
