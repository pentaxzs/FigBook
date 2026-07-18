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
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

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

  return (
    <AuthContext.Provider value={{ user, ready, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
