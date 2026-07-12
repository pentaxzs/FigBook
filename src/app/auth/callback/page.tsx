'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const search = window.location.search
    const hashParams = new URLSearchParams(hash)
    const searchParams = new URLSearchParams(search)

    // Error in hash (e.g. expired or already-used link)
    if (hashParams.get('error')) {
      router.replace('/login?error=link_expired')
      return
    }

    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
        router.replace(session ? '/' : '/login')
      })
    } else if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as 'magiclink' | 'email' }).then(({ data: { session } }) => {
        router.replace(session ? '/' : '/login')
      })
    } else if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data: { session } }) => {
        router.replace(session ? '/' : '/login')
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? '/' : '/login')
      })
    }
  }, [router])

  return (
    <div className="-mt-14 -mb-20 h-dvh bg-background flex items-center justify-center">
      <p className="text-sm text-secondary">로그인 중...</p>
    </div>
  )
}
