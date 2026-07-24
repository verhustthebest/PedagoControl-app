import { z } from 'zod'
import { normalizeDrcPhone } from '../security/phone-identity'

const text = (max: number) => z.string().trim().min(1).max(max)
const nullableText = (max: number) => z.union([text(max), z.literal('').transform(() => null), z.null()])
const isAtLeastYearsOld = (value: string, years: number) => {
  const birth = new Date(`${value}T00:00:00.000Z`)
  const today = new Date()
  const limit = new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()))
  return birth <= limit
}

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
export const drcPhone = z.string().trim().transform((value, context) => {
  try { return normalizeDrcPhone(value) } catch { context.addIssue({ code: 'custom', message: 'Invalid Congolese phone' }); return z.NEVER }
})
export const schoolParams = z.object({ schoolId: resourceIdentifier }).strict()
export const studentParams = z.object({ schoolId: resourceIdentifier, studentId: resourceIdentifier }).strict()
export const guardianParams = z.object({ schoolId: resourceIdentifier, guardianId: resourceIdentifier }).strict()
export const guardianLinkParams = z.object({ schoolId: resourceIdentifier, studentId: resourceIdentifier, guardianId: resourceIdentifier }).strict()
export const invoiceParams = z.object({ schoolId: resourceIdentifier, invoiceId: publicId }).strict()

export const loginBody = z.object({
  email: z.string().trim().max(254).transform(v => v.includes('@') ? v.toLowerCase() : v.replace(/[\s().-]/g, '')),
  password: z.string().min(1).max(256),
  remember_me: z.boolean().optional().default(false),
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
export const schoolListQuery = z.object({ page, limit, search: z.string().trim().max(150).optional(), status: z.string().trim().regex(/^[a-z_]{2,30}$/).optional() }).strict()
export const schoolSubscriptionListQuery = z.object({
  page, limit, search: z.string().trim().max(150).optional(),
  status: z.enum(['active', 'expiring_soon', 'overdue', 'expired', 'suspended']).optional(),
  plan: z.enum(['LOCAL_TEST', 'BASIC', 'GOLD', 'EXTRA', 'PROFESSIONAL']).optional(),
  billing_period: z.enum(['monthly', 'quarterly', 'annual']).optional(),
}).strict()
export const schoolPublicParams = z.object({ schoolId: publicId }).strict()
export const geographyParentParams = z.object({ parentId: publicId }).strict()
export const geographyNameBody = z.object({ name: text(120) }).strict()
const schoolType = z.enum(['Complexe scolaire', 'Collège', 'Lycée', 'Groupe scolaire', 'Institut', 'E.P', 'E.P 1', 'E.P 2', 'E.P 3'])
const schoolInformation = z.object({
  name: text(150), school_type: schoolType, phone, email, address: text(500), province_id: publicId,
  city_id: publicId, commune_id: publicId, neighborhood_id: publicId.optional(), geographic_reference: nullableText(500).optional(),
}).strict()
const adultBirthDate = date.refine(value => isAtLeastYearsOld(value, 18), 'La personne doit être âgée d’au moins 18 ans.')
const schoolResponsible = z.object({ first_name: text(100), last_name: text(100), birth_date: adultBirthDate, email, phone: drcPhone.optional() }).strict()
const schoolAcademicBase = z.object({
  year_name: text(100), start_date: date, end_date: date,
  parental_enabled: z.boolean(),
}).strict()
const schoolAcademic = schoolAcademicBase.extend({ teacher_limit: z.number().int().min(1).max(10000) }).strict()
const schoolSubscription = z.object({ subscription_code: text(30), billing_period: z.enum(['monthly', 'quarterly', 'annual']) }).strict()
const schoolAccount = z.object({ first_name: text(100), last_name: text(100), email, phone: drcPhone, password: z.string().min(10).max(256) }).strict()
const draftIdentity = { draft_id: publicId.optional() }
export const schoolDraftBody = z.discriminatedUnion('current_step', [
  z.object({ ...draftIdentity, current_step:z.literal(1), data:z.object({ school:schoolInformation }).strict() }).strict(),
  z.object({ ...draftIdentity, current_step:z.literal(2), data:z.object({ school:schoolInformation, responsible:schoolResponsible }).strict() }).strict(),
  z.object({ ...draftIdentity, current_step:z.literal(3), data:z.object({ school:schoolInformation, responsible:schoolResponsible, academic:schoolAcademicBase }).strict() }).strict(),
  z.object({ ...draftIdentity, current_step:z.literal(4), data:z.object({ school:schoolInformation, responsible:schoolResponsible, academic:schoolAcademic, subscription:schoolSubscription }).strict() }).strict(),
  z.object({ ...draftIdentity, current_step:z.literal(5), data:z.object({ school:schoolInformation, responsible:schoolResponsible, academic:schoolAcademic, subscription:schoolSubscription, account:schoolAccount.omit({password:true}) }).strict() }).strict(),
])
export const schoolOnboardingBody = z.object({ draft_id: publicId, school: schoolInformation, responsible: schoolResponsible, academic: schoolAcademic, subscription: schoolSubscription, account: schoolAccount }).strict()
export const schoolStaffBody = z.object({
  first_name: text(100),
  last_name: text(100),
  birth_date: adultBirthDate,
  email,
  phone: drcPhone.optional(),
  password: z.string().min(10).max(256),
  role: z.enum(['PREFET', 'ENSEIGNANT', 'DIRECTEUR', 'PROMOTEUR', 'INFORMATICIEN']),
}).strict()
export const phoneIdentityBody = z.object({ phone: drcPhone, first_name: text(100), last_name: text(100) }).strict()

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
  first_name: text(100), last_name: text(100), middle_name: nullableText(100).optional(), phone: drcPhone.nullable().optional(), email: email.nullable().optional(),
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
export const notificationTestBody=z.object({workflow:z.enum(['PARENT_OTP','PARENT_INVITATION','ATTACHMENT_DECISION','PARENT_CONTRIBUTION_REMINDER','SCHOOL_INVOICE']),channel:z.enum(['email','sms']),destination:z.string().trim().min(7).max(254)}).strict()

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
export const contributionSettingBody=z.object({mode:z.enum(['PRIS_EN_CHARGE_PAR_ECOLE','CONTRIBUTION_PARENT']),monthly_amount:amount.optional(),currency:z.string().trim().regex(/^[A-Z]{3}$/).optional(),due_day:z.number().int().min(1).max(28).optional(),grace_days:z.number().int().min(0).max(60).optional(),reminder_days:z.array(z.number().int().min(0).max(60)).max(10).optional()}).strict().superRefine((v,c)=>{if(v.mode==='CONTRIBUTION_PARENT'&&v.monthly_amount===undefined)c.addIssue({code:'custom',path:['monthly_amount'],message:'Amount required'})})
export const contributionGenerateBody=z.object({period:month}).strict();export const contributionDueParams=z.object({schoolId:resourceIdentifier,dueId:publicId}).strict();export const contributionListQuery=z.object({page,limit,period:month.optional(),status:z.enum(['PRIS_EN_CHARGE','EN_REGLE','A_RENOUVELER','PARTIEL','EN_RETARD','SUSPENDU']).optional(),student:publicId.optional()}).strict();export const contributionPaymentBody=z.object({amount,payment_method:z.enum(['cash','bank_transfer','mobile_money']),reference:nullableText(150).optional(),notes:nullableText(1000).optional()}).strict();export const contributionAutomationBody=z.object({}).strict()
