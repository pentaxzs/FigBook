'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const init = async () => {
      // Hash token may already be processed — check session first
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/')
        return
      }

      // Otherwise wait for onAuthStateChange to fire
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          router.replace('/')
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    }

    init()

    return () => { unsubscribe?.() }
  }, [router])

  return (
    <div className="-mt-14 -mb-20 h-dvh bg-background flex items-center justify-center">
      <p className="text-sm text-secondary">로그인 중...</p>
    </div>
  )
}
