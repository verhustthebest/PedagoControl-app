import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { portalForRoles, protectedRouteDecision } from './routePolicy'

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
  if (decision === 'forbidden') return <Navigate to={portalForRoles(roles)} replace />
  return children ?? <Outlet />
}
