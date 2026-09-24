'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { storage } from '@/lib/storage'
import { SupabaseAdapter } from '@/lib/storage/SupabaseAdapter'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import { migrateLocalToSupabase } from '@/lib/storage/migration'

interface AuthContextValue {
  user: User | null
  ready: boolean
  error: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  error: null,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function activateSupabase(u: User) {
    const adapter = new SupabaseAdapter(supabase, u.id)
    storage.setAdapter(adapter)
    setUser(u)
    const localAdapter = new LocalStorageAdapter()
    void migrateLocalToSupabase(localAdapter, adapter)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        activateSupabase(session.user).then(() => setReady(true))
      } else {
        setReady(true)
      }
    }).catch(() => {
      setError('서버에 연결할 수 없습니다')
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        activateSupabase(session.user)
      } else {
        storage.setAdapter(new LocalStorageAdapter())
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold font-mono mb-2 text-foreground">🐿️ Metrics Pad</h1>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <p className="text-xs text-secondary mb-6 leading-relaxed">
            Supabase 프로젝트가 일시정지되었거나,<br />
            네트워크 연결에 문제가 있을 수 있어요.<br />
            Supabase 대시보드에서 프로젝트 상태를 확인해주세요.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-foreground text-background px-6 py-3 text-sm font-medium min-h-[44px] flex items-center justify-center"
            >
              Supabase 대시보드 열기
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 text-sm font-medium cursor-pointer min-h-[44px]"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, ready, error, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
