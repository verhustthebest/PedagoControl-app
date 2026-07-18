import { z } from 'zod'

const text = (max: number) => z.string().trim().min(1).max(max)
const nullableText = (max: number) => z.union([text(max), z.literal('').transform(() => null), z.null()])

export const id = z.string().regex(/^[1-9]\d*$/).refine((value) => {
  try { return BigInt(value) > 0n } catch { return false }
}, 'Invalid identifier')
export const publicId = z.string().uuid()
export const resourceIdentifier = z.union([id, publicId])

export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}, 'Invalid date')
export const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
export const page = z.string().regex(/^[1-9]\d*$/).optional()
export const limit = z.string().regex(/^[1-9]\d*$/).refine((v) => Number(v) <= 100).optional()
export const amount = z.union([z.number().finite().positive(), z.string().regex(/^\d+(?:\.\d{1,2})?$/).refine(v => Number(v) > 0 && Number.isFinite(Number(v)))])
export const email = z.string().trim().toLowerCase().email().max(254)
export const phone = z.string().trim().transform(v => v.replace(/[\s().-]/g, '')).pipe(z.string().regex(/^\+?[1-9]\d{6,14}$/))
export const schoolParams = z.object({ schoolId: resourceIdentifier }).strict()
export const studentParams = z.object({ schoolId: resourceIdentifier, studentId: resourceIdentifier }).strict()
export const guardianParams = z.object({ schoolId: resourceIdentifier, guardianId: resourceIdentifier }).strict()
export const guardianLinkParams = z.object({ schoolId: resourceIdentifier, studentId: resourceIdentifier, guardianId: resourceIdentifier }).strict()
export const invoiceParams = z.object({ schoolId: resourceIdentifier, invoiceId: publicId }).strict()

export const loginBody = z.object({
  email: z.string().trim().max(254).transform(v => v.includes('@') ? v.toLowerCase() : v.replace(/[\s().-]/g, '')),
  password: z.string().min(1).max(256),
}).strict()
export const requestOtpBody = z.object({ school_code: text(50), contact: z.string().trim().max(254), channel: z.enum(['email', 'whatsapp', 'sms']) }).strict()
export const verifyOtpBody = z.object({ verification_id: id, otp: z.string().regex(/^\d{6}$/) }).strict()
export const registerParentBody = z.object({ registration_token: z.string().min(16).max(2048), password: z.string().min(8).max(256) }).strict()

export const reportBody = z.object({
  program_distribution_id: id, teacher_assignment_id: id,
  actual_date: date.optional(), actual_start_time: time.optional(), actual_end_time: time.optional(),
  actual_periods: z.number().int().positive().max(24).optional(), lesson_summary: text(4000),
  objectives_achieved: text(4000).optional(), exercises_given: text(4000).optional(),
  homework_given: text(4000).optional(), observations: text(4000).optional(),
}).strict()
export const reportDecisionBody = z.object({ decision: z.enum(['validated', 'rejected', 'correction_requested']), observation: text(4000).optional() }).strict()
export const reportParams = z.object({ id }).strict()

export const messageBody = z.object({ title: text(200).optional(), message: text(5000), recipient: z.enum(['teachers', 'all_teachers', 'all']).optional() }).strict()
export const itemParams = z.object({ id }).strict()
export const emptyQuery = z.object({}).strict()
export const paginationQuery = z.object({ page, limit }).strict()

export const settingsBody = z.object({
  is_enabled: z.boolean().optional(), attachment_requires_validation: z.boolean().optional(),
  attachment_request_expiry_days: z.number().int().min(1).max(365).optional(),
  otp_expiry_minutes: z.number().int().min(1).max(1440).optional(), otp_max_attempts: z.number().int().min(1).max(20).optional(),
  daily_acknowledgement_required: z.boolean().optional(), daily_acknowledgement_deadline: time.nullable().optional(),
}).strict()
export const subscriptionBody = z.object({ unit_price_per_student: amount, school_subscription_id: id.optional() }).strict()

const studentFields = {
  first_name: text(100), last_name: text(100), middle_name: text(100), gender: z.enum(['M', 'F', 'm', 'f']).transform(v => v.toUpperCase()),
  birth_date: date, birth_place: text(200), address: text(500), profile_photo: nullableText(2048).optional(),
  status: z.enum(['active', 'inactive']).optional(), academic_year_class_id: resourceIdentifier.optional(),
}
export const createStudentBody = z.object(studentFields).strict()
export const updateStudentBody = z.object(studentFields).partial().strict()
export const studentListQuery = z.object({ search: z.string().trim().max(200).optional(), academic_year_class_id: id.optional(), status: z.enum(['active', 'inactive']).optional(), parental_tracking_enabled: z.enum(['true', 'false']).optional(), page, limit }).strict()
export const trackingBody = z.object({ enabled: z.boolean() }).strict()

const guardianFields = {
  first_name: text(100), last_name: text(100), middle_name: nullableText(100).optional(), phone: phone.nullable().optional(), email: email.nullable().optional(),
  national_id_number: nullableText(100).optional(), occupation: nullableText(150).optional(), address: nullableText(500).optional(),
  preferred_contact_method: z.enum(['email', 'phone', 'sms', 'whatsapp']).nullable().optional(), status: z.enum(['active', 'inactive']).optional(),
}
export const createGuardianBody = z.object(guardianFields).strict()
export const updateGuardianBody = z.object(guardianFields).partial().strict()
export const guardianListQuery = z.object({ search: z.string().trim().max(200).optional(), status: z.enum(['active', 'inactive']).optional(), page, limit }).strict()
export const linkGuardianBody = z.object({ guardian_id: id, relationship_type: text(100), is_primary: z.boolean().optional(), can_receive_alerts: z.boolean().optional(), can_view_journal: z.boolean().optional() }).strict()

export const invoiceGenerateBody = z.object({ billing_month: month }).strict()
export const invoiceListQuery = z.object({ page, limit, status: z.enum(['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional() }).strict()
export const paymentBody = z.object({ amount, payment_method: z.enum(['cash', 'bank_transfer', 'mobile_money']), transaction_reference: nullableText(200).optional(), notes: nullableText(2000).optional() }).strict()
export const actionTokenQuery = z.object({ token: z.string().min(80).max(200) }).strict()
export const journalQuery = z.object({ date: date.optional() }).strict()
export const acknowledgementBody = z.object({ journal_date: date, comment: text(2000).optional() }).strict()
export const notificationQuery = z.object({ page, limit, unread: z.enum(['true', 'false']).optional() }).strict()

export const attachmentRequestParams = z.object({ schoolId: resourceIdentifier, requestId: publicId }).strict()
export const attachmentDocumentParams = z.object({ schoolId: resourceIdentifier, requestId: publicId, documentId: publicId }).strict()
export const attachmentRequestQuery = z.object({ status: z.enum(['BROUILLON','EN_ATTENTE','APPROUVE','REFUSE','DESACTIVE']).optional(), search: z.string().trim().max(200).optional(), from: date.optional(), to: date.optional(), page, limit }).strict()
export const attachmentDecisionBody = z.object({ decision: z.enum(['APPROUVE','REFUSE']), reason: text(1000).optional() }).strict().superRefine((value,context)=>{if(value.decision==='REFUSE'&&!value.reason)context.addIssue({code:'custom',path:['reason'],message:'A refusal reason is required'})})
export const attachmentDisableBody = z.object({ reason: text(1000) }).strict()
export const attachmentDocumentBody = z.object({ document_type: z.enum(['identity','parentage','other']), file_name: text(255), mime_type: z.enum(['application/pdf','image/jpeg','image/png']), file_size: z.number().int().positive(), file_url: z.string().url().max(2048).optional(), storage_key: text(500).optional() }).strict().refine(value=>value.file_url||value.storage_key,{message:'External storage reference required'})
export const classListQuery = z.object({ search:z.string().trim().max(200).optional(), academic_year:publicId.optional(), section:z.string().trim().max(100).optional(), page, limit }).strict()
export const guardianInvitationParams = z.object({ schoolId:resourceIdentifier, guardianId:publicId }).strict()
export const technicalJournalQuery=z.object({date:date.optional(),class_id:publicId.optional(),student_id:publicId.optional(),status:z.enum(['vise','non_vise']).optional(),page,limit}).strict()
export const technicalJournalParams=z.object({schoolId:resourceIdentifier,journalId:z.string().regex(/^[A-Za-z0-9_-]{40,200}$/)}).strict()
