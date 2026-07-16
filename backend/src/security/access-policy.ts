export type AccessIdentity = {
  school_id: string | null
  roles: string[]
  permissions: string[]
}

export const TEACHER_ROLES = ['ENSEIGNANT'] as const
export const PREFECT_ROLES = [
  'PREFET',
  'PREFET_DES_ETUDES',
  'DIRECTEUR_ETUDES',
  'DIRECTEUR_DES_ETUDES',
] as const
export const SUPERVISION_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_GESTIONNAIRE',
  'PROMOTEUR',
  'DIRECTEUR',
  'DIRECTION',
  'MANAGEMENT',
] as const
export const SCHOOL_LIST_ROLES = ['SUPER_ADMIN', 'MANAGEMENT'] as const

export function hasAnyRole(identity: AccessIdentity, allowedRoles: readonly string[]) {
  return identity.roles.some((role) => allowedRoles.includes(role))
}

export function isSuperAdmin(identity: AccessIdentity) {
  return identity.roles.includes('SUPER_ADMIN')
}

export function hasUsableSchoolContext(identity: AccessIdentity) {
  return identity.school_id !== null || isSuperAdmin(identity)
}

export function canBroadcast(identity: AccessIdentity) {
  if (hasAnyRole(identity, ['PARENT', 'ENSEIGNANT'])) return false

  if (identity.school_id !== null) {
    return identity.permissions.includes('BROADCAST_SCHOOL_MESSAGES')
  }

  return isSuperAdmin(identity) && identity.permissions.includes('BROADCAST_GLOBAL_MESSAGES')
}

export function canListAllSchools(identity: AccessIdentity) {
  return isSuperAdmin(identity) || hasAnyRole(identity, SCHOOL_LIST_ROLES)
}
