export const DIRECTION_ROLES = [
  'DIRECTEUR',
  'DIRECTION',
  'PROMOTEUR',
  'DIRECTEUR_ETUDES',
  'DIRECTEUR_DES_ETUDES',
] as const

export const PRIVATE_ROUTE_POLICIES = [
  { prefix: '/management', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin', roles: ['ADMIN_GESTIONNAIRE'] },
  { prefix: '/informaticien', roles: ['INFORMATICIEN'] },
  { prefix: '/parent', roles: ['PARENT'] },
  { prefix: '/prefet', roles: ['PREFET'] },
  { prefix: '/enseignant', roles: ['ENSEIGNANT'] },
  { prefix: '/directeur', roles: [...DIRECTION_ROLES] },
] as const

export function hasAllowedRole(userRoles: readonly string[], allowedRoles: readonly string[]) {
  return allowedRoles.some((role) => userRoles.includes(role))
}

export function allowedRolesForPath(pathname: string): readonly string[] | null {
  const policy = PRIVATE_ROUTE_POLICIES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  return policy?.roles ?? null
}

export function canAccessPath(pathname: string, userRoles: readonly string[]) {
  const allowedRoles = allowedRolesForPath(pathname)
  return allowedRoles !== null && hasAllowedRole(userRoles, allowedRoles)
}

export function protectedRouteDecision(loading: boolean, authenticated: boolean, userRoles: readonly string[], allowedRoles: readonly string[]) {
  if (loading) return 'loading' as const
  if (!authenticated) return 'unauthenticated' as const
  if (!hasAllowedRole(userRoles, allowedRoles)) return 'forbidden' as const
  return 'allowed' as const
}
