import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AUTH_UNAUTHENTICATED_EVENT, authApi, cleanupLegacyAuthStorage,
  establishMemorySession, type AuthUser, type LoginResponse,
} from '../services/api'

type AuthContextValue = {
  loading: boolean
  authenticated: boolean
  sessionExpired: boolean
  user: AuthUser | null
  roles: string[]
  establishSession: (session: LoginResponse) => void
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let active = true
    cleanupLegacyAuthStorage()
    void authApi.restore()
      .then((session) => { if (active) setUser(session?.user ?? null) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const unauthenticated = () => {
      setUser(null)
      setSessionExpired(true)
    }
    window.addEventListener(AUTH_UNAUTHENTICATED_EVENT, unauthenticated)
    return () => {
      window.removeEventListener(AUTH_UNAUTHENTICATED_EVENT, unauthenticated)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    loading,
    authenticated: !loading && Boolean(user),
    sessionExpired,
    user,
    roles: user?.roles ?? [],
    establishSession(session) {
      establishMemorySession(session)
      setSessionExpired(false)
      setUser({ ...session.user, roles: session.roles || session.user.roles })
    },
    async logout() {
      setUser(null)
      setSessionExpired(false)
      await authApi.logout()
    },
    async logoutAll() {
      setUser(null)
      setSessionExpired(false)
      await authApi.logoutAll()
    },
  }), [loading, sessionExpired, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
