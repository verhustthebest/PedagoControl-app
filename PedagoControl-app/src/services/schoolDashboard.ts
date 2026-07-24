import { apiRequest } from './api'

export type SchoolDashboard = {
  school: { public_id: string; name: string; code: string; status: string }
  academic_year: { public_id: string; name: string; start_date: string; end_date: string } | null
  counts: { users: number; teachers: number; students: number }
  subscription: {
    plan: { code: string; name: string }
    status: string
    billing_period: string
    teacher_limit: number
    start_date: string
    end_date: string
  } | null
  modules: { pedagogical_control: true; parental_tracking: boolean }
  activities: Array<{
    type: string
    module: string
    title: string
    occurred_at: string
    actor: { public_id: string; name: string }
  }>
}

/** Charge le résumé strictement limité à l'école publique de la session. */
export function getSchoolDashboard(schoolPublicId: string) {
  return apiRequest<{ dashboard: SchoolDashboard }>(
    `/schools/${encodeURIComponent(schoolPublicId)}/dashboard`,
  )
}
