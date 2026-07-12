'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
        if (session) router.replace('/')
        else router.replace('/login')
      })
    } else {
      // Fallback: check if session already exists
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.replace('/')
        else router.replace('/login')
      })
    }
  }, [router])

  return (
    <div className="-mt-14 -mb-20 h-dvh bg-background flex items-center justify-center">
      <p className="text-sm text-secondary">로그인 중...</p>
    </div>
  )
}
