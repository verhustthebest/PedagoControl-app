import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { protectedRouteDecision } from './routePolicy'

export function ProtectedRoute({ allowedRoles, children }: {
  allowedRoles: readonly string[]
  children?: ReactNode
}) {
  const { loading, authenticated, sessionExpired, user, roles } = useAuth()
  const location = useLocation()
  const decision = protectedRouteDecision(loading, authenticated && Boolean(user), roles, allowedRoles)

  if (decision === 'loading') return <main className="access-state"><p>Vérification sécurisée de la session…</p></main>
  if (decision === 'unauthenticated') {
    return <Navigate to={sessionExpired ? '/non-authentifie' : '/login'} replace state={{ from: location.pathname }} />
  }
  // Une session valide n'est envoyée vers le 403 que si son rôle réel est refusé.
  if (decision === 'forbidden') return <Navigate to="/acces-interdit" replace />
  return children ?? <Outlet />
}
