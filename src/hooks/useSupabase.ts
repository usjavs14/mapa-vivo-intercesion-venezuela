/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type UserProfile = {
  id: string
  email: string
  display_name: string | null
  role: 'intercesor' | 'moderador' | 'pastor' | 'admin'
  estado: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setUser(data as UserProfile)
    setLoading(false)
  }

  return { user, loading }
}

export function useHeartbeat(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!userId) return

    async function beat() {
      await supabase.from('prayer_sessions').upsert(
        { user_id: userId, last_seen: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }

    beat()
    intervalRef.current = setInterval(beat, 30_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      supabase.from('prayer_sessions').delete().eq('user_id', userId)
    }
  }, [userId])
}

export function usePresence() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { count: c } = await supabase
        .from('prayer_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinAgo)
      setCount(c ?? 0)
    }

    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [])

  return count
}
