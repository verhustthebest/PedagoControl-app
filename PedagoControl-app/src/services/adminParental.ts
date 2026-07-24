import { apiRequest, type AuthUser } from './api'

export type LoadState<T> = { status: 'loading' | 'success' | 'empty' | 'error'; data: T | null; message?: string }
export type SchoolSummary = { public_id: string; name: string | null; code?: string; status?: string }
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

export type Student = {
  id?: string; public_id: string; matricule?: string; first_name: string; last_name: string; middle_name?: string | null
  gender?: string; birth_date?: string; birth_place?: string; address?: string; status?: string
  enrollment?: { parental_tracking_enabled?: boolean; tracking_status?: 'Inactif' | 'Programmé' | 'Actif'; academic_year_classes?: { school_classes?: { name?: string }; academic_years?: { name?: string } } } | null
}
export type Guardian = {
  id?: string; public_id: string; first_name: string; last_name: string; middle_name?: string | null; phone?: string | null
  email?: string | null; address?: string | null; occupation?: string | null; preferred_contact_method?: string | null; status?: string
  student_guardians?: { status?: string; relationship_type?: string; students?: Student }[]
}
export type Page<T> = { items: T[]; page: number; total: number; pages: number }
export type AttachmentStatus = 'BROUILLON' | 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE' | 'DESACTIVE'
export type AttachmentDocument = { public_id: string; document_type: string; file_name: string; mime_type: 'application/pdf'|'image/jpeg'|'image/png'; file_size: string; created_at?: string }
export type AttachmentRequest = { public_id:string; request_code:string; relationship_type:string; status:AttachmentStatus; request_message?:string|null; review_comment?:string|null; submitted_at:string; reviewed_at?:string|null; expires_at?:string|null; guardian:{public_id:string;first_name:string;last_name:string;phone?:string|null;email?:string|null}; student:{public_id:string;matricule?:string;first_name:string;last_name:string}; documents:AttachmentDocument[] }
export type AnnualClass = { public_id:string; is_active:boolean; academic_year:{public_id:string;name:string;is_active:boolean}; class:{public_id:string;name:string;parallel?:string|null;level:string;section?:string|null;is_active:boolean} }
export type InvitationResult = { message:string; expires_in_minutes:number }
export type AttachmentFilters = { status?:AttachmentStatus; search?:string; from?:string; to?:string; page?:number; limit?:number }

function queryString(values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
  return query.toString()
}

export const studentTrackingLabel = (student: Student) => student.enrollment?.tracking_status || (student.enrollment?.parental_tracking_enabled ? 'Actif' : 'Inactif')

export const adminParentalApi = {
  async attachmentRequests(schoolId:string,filters:AttachmentFilters={}):Promise<Page<AttachmentRequest>>{const payload=await apiRequest<{requests:AttachmentRequest[];pagination:{page:number;total:number;total_pages:number}}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests?${queryString(filters as Record<string,string|number|undefined>)}`);return{items:payload.requests,page:payload.pagination.page,total:payload.pagination.total,pages:payload.pagination.total_pages}},
  attachmentRequest:(schoolId:string,publicId:string)=>apiRequest<{request:AttachmentRequest}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests/${encodeURIComponent(publicId)}`),
  decideAttachment:(schoolId:string,publicId:string,decision:'APPROUVE'|'REFUSE',reason?:string)=>apiRequest<{request:AttachmentRequest}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests/${encodeURIComponent(publicId)}/decision`,{method:'POST',body:JSON.stringify({decision,...(reason?{reason}:{})})}),
  disableAttachment:(schoolId:string,publicId:string,reason:string)=>apiRequest<{request:AttachmentRequest}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests/${encodeURIComponent(publicId)}/disable`,{method:'POST',body:JSON.stringify({reason})}),
  addAttachmentDocument:(schoolId:string,requestId:string,body:Record<string,unknown>)=>apiRequest<{document:AttachmentDocument}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests/${encodeURIComponent(requestId)}/documents`,{method:'POST',body:JSON.stringify(body)}),
  removeAttachmentDocument:(schoolId:string,requestId:string,documentId:string)=>apiRequest<void>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests/${encodeURIComponent(requestId)}/documents/${encodeURIComponent(documentId)}`,{method:'DELETE'}),
  async classes(schoolId:string,filters:{search?:string;academic_year?:string;section?:string;page?:number;limit?:number}={}):Promise<Page<AnnualClass>>{const payload=await apiRequest<{classes:AnnualClass[];pagination:{page:number;total:number;total_pages:number}}>(`/schools/${encodeURIComponent(schoolId)}/classes?${queryString(filters)}`);return{items:payload.classes,page:payload.pagination.page,total:payload.pagination.total,pages:payload.pagination.total_pages}},
  prepareInvitation:(schoolId:string,guardianPublicId:string)=>apiRequest<InvitationResult>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians/${encodeURIComponent(guardianPublicId)}/invitation`,{method:'POST'}),
  async students(schoolId: string, filters: { search?: string; status?: string; tracking?: string; page?: number; limit?: number } = {}): Promise<Page<Student>> {
    const payload = await apiRequest<{ students: Student[]; pagination: { page: number; total: number; total_pages: number } }>(`/parental/schools/${encodeURIComponent(schoolId)}/students?${queryString(filters)}`)
    return { items: payload.students, page: payload.pagination.page, total: payload.pagination.total, pages: payload.pagination.total_pages }
  },
  student: (schoolId: string, publicId: string) => apiRequest<{ student: Student }>(`/parental/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(publicId)}`),
  createStudent: (schoolId: string, body: Record<string, unknown>) => apiRequest<{ student: Student }>(`/parental/schools/${encodeURIComponent(schoolId)}/students`, { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (schoolId: string, publicId: string, body: Record<string, unknown>) => apiRequest<{ student: Student }>(`/parental/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(publicId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  setTracking: (schoolId: string, publicId: string, enabled: boolean) => apiRequest<{ student: Student }>(`/parental/schools/${encodeURIComponent(schoolId)}/students/${encodeURIComponent(publicId)}/tracking`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  async guardians(schoolId: string, filters: { search?: string; status?: string; page?: number; limit?: number } = {}): Promise<Page<Guardian>> {
    const payload = await apiRequest<{ guardians: Guardian[]; pagination: { page: number; total: number; total_pages: number } }>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians?${queryString(filters)}`)
    return { items: payload.guardians, page: payload.pagination.page, total: payload.pagination.total, pages: payload.pagination.total_pages }
  },
  guardian: (schoolId: string, publicId: string) => apiRequest<{ guardian: Guardian }>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians/${encodeURIComponent(publicId)}`),
  createGuardian: (schoolId: string, body: Record<string, unknown>) => apiRequest<{ guardian: Guardian }>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians`, { method: 'POST', body: JSON.stringify(body) }),
  updateGuardian: (schoolId: string, publicId: string, body: Record<string, unknown>) => apiRequest<{ guardian: Guardian }>(`/parental/schools/${encodeURIComponent(schoolId)}/guardians/${encodeURIComponent(publicId)}`, { method: 'PUT', body: JSON.stringify(body) }),
  createAttachmentRequest:(schoolId:string,studentPublicId:string,guardianPublicId:string,relationshipType:string)=>apiRequest<{request:AttachmentRequest}>(`/parental/schools/${encodeURIComponent(schoolId)}/attachment-requests`,{method:'POST',body:JSON.stringify({student_id:studentPublicId,guardian_id:guardianPublicId,relationship_type:relationshipType})}),
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
  // /schools est une liste Management. Le portail école utilise exclusivement
  // l'établissement public déjà contrôlé et retourné par /auth/me.
  const school: SchoolSummary | null = user.school
    ? { public_id: user.school.public_id, name: user.school.name }
    : null
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
