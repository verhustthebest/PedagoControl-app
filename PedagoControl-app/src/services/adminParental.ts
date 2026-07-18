import { apiRequest, type AuthUser } from './api'

export type LoadState<T> = { status: 'loading' | 'success' | 'empty' | 'error'; data: T | null; message?: string }
export type SchoolSummary = { id: string; public_id?: string; name: string; code?: string; status?: string }
export type ParentalSettings = {
  is_enabled: boolean
  enabled_at?: string | null
  attachment_requires_validation?: boolean
  daily_acknowledgement_required?: boolean
  otp_expiry_minutes?: number
}
export type ParentalSubscription = {
  unit_price_per_student?: string
  currency?: string
  billing_period?: string
  next_invoice_date?: string | null
  status?: string
}
export type AdminPortalData = {
  school: SchoolSummary | null
  settings: ParentalSettings | null
  subscription: ParentalSubscription | null
  students: number | null
  trackedStudents: number | null
  guardians: number | null
  unreadNotifications: number | null
  unavailable: string[]
}

const totalOf = (payload: { pagination?: { total?: number } }) =>
  typeof payload.pagination?.total === 'number' ? payload.pagination.total : null

async function optional<T>(request: Promise<T>): Promise<T | null> {
  try { return await request } catch { return null }
}

export function schoolApiIdentifier(user: AuthUser, school: SchoolSummary | null) {
  return school?.public_id || user.school_id
}

export async function loadAdminPortal(user: AuthUser): Promise<AdminPortalData> {
  if (!user.school_id) throw new Error('École associée indisponible')
  const schoolsPayload = await optional(apiRequest<{ schools: SchoolSummary[] }>('/schools?page=1&limit=1'))
  const school = schoolsPayload?.schools?.[0] ?? null
  const schoolId = schoolApiIdentifier(user, school)
  if (!schoolId) throw new Error('École associée indisponible')

  const [settingsPayload, subscriptionPayload, studentsPayload, trackedPayload, guardiansPayload, notificationsPayload] = await Promise.all([
    optional(apiRequest<{ settings: ParentalSettings | null }>(`/parental/settings/${encodeURIComponent(schoolId)}`)),
    optional(apiRequest<{ subscription: ParentalSubscription | null }>(`/parental/subscription/${encodeURIComponent(schoolId)}`)),
    optional(apiRequest<{ pagination?: { total?: number } }>(`/parental/schools/${encodeURIComponent(schoolId)}/students?page=1&limit=1`)),
    optional(apiRequest<{ pagination?: { total?: number } }>(`/parental/schools/${encodeURIComponent(schoolId)}/students?page=1&limit=1&parental_tracking_enabled=true`)),
    optional(apiRequest<{ pagination?: { total?: number } }>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians?page=1&limit=1`)),
    optional(apiRequest<{ count?: number }>('/notifications/unread-count')),
  ])

  const data: AdminPortalData = {
    school,
    settings: settingsPayload?.settings ?? null,
    subscription: subscriptionPayload?.subscription ?? null,
    students: studentsPayload ? totalOf(studentsPayload) : null,
    trackedStudents: trackedPayload ? totalOf(trackedPayload) : null,
    guardians: guardiansPayload ? totalOf(guardiansPayload) : null,
    unreadNotifications: typeof notificationsPayload?.count === 'number' ? notificationsPayload.count : null,
    unavailable: [],
  }
  if (!data.settings) data.unavailable.push('configuration du module')
  if (!data.subscription) data.unavailable.push('tarification et prochaine facturation')
  if (data.students === null) data.unavailable.push('élèves')
  if (data.guardians === null) data.unavailable.push('parents et tuteurs')
  return data
}

export async function saveParentalConfiguration(schoolId: string, settings: ParentalSettings) {
  return apiRequest<{ settings: ParentalSettings }>(`/parental/settings/${encodeURIComponent(schoolId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      is_enabled: settings.is_enabled,
      attachment_requires_validation: settings.attachment_requires_validation,
      daily_acknowledgement_required: settings.daily_acknowledgement_required,
    }),
  })
}
