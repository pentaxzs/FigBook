'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [debug, setDebug] = useState('')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const search = window.location.search
    const hashParams = new URLSearchParams(hash)
    const searchParams = new URLSearchParams(search)

    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    setDebug(`hash: ${hash.slice(0, 30) || '없음'} | code: ${code ? '있음' : '없음'} | token_hash: ${token_hash ? '있음' : '없음'} | type: ${type || '없음'}`)

    if (access_token && refresh_token) {
      // Implicit flow: tokens in hash
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
        if (session) router.replace('/')
        else router.replace('/login')
      })
    } else if (token_hash && type) {
      // Token hash flow
      supabase.auth.verifyOtp({ token_hash, type: type as 'magiclink' | 'email' }).then(({ data: { session } }) => {
        if (session) router.replace('/')
        else router.replace('/login')
      })
    } else if (code) {
      // PKCE flow (may fail cross-browser)
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session } }) => {
        if (session) router.replace('/')
        else router.replace('/login')
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.replace('/')
        // else: stay on this page showing debug info
      })
    }
  }, [router])

  return (
    <div className="-mt-14 -mb-20 h-dvh bg-background flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-sm text-secondary">로그인 중...</p>
      {debug && <p className="text-xs text-secondary font-mono text-center break-all">{debug}</p>}
    </div>
  )
}
