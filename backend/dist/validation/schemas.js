"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachmentDecisionBody = exports.attachmentRequestQuery = exports.attachmentDocumentParams = exports.attachmentRequestParams = exports.notificationQuery = exports.acknowledgementBody = exports.journalQuery = exports.actionTokenQuery = exports.paymentBody = exports.invoiceListQuery = exports.invoiceGenerateBody = exports.linkGuardianBody = exports.guardianListQuery = exports.updateGuardianBody = exports.createGuardianBody = exports.trackingBody = exports.studentListQuery = exports.updateStudentBody = exports.createStudentBody = exports.subscriptionBody = exports.settingsBody = exports.schoolPublicParams = exports.schoolListQuery = exports.paginationQuery = exports.emptyQuery = exports.itemParams = exports.messageBody = exports.reportParams = exports.reportDecisionBody = exports.reportBody = exports.registerParentBody = exports.verifyOtpBody = exports.requestOtpBody = exports.loginBody = exports.invoiceParams = exports.guardianLinkParams = exports.guardianParams = exports.studentParams = exports.schoolParams = exports.phone = exports.email = exports.amount = exports.limit = exports.page = exports.time = exports.month = exports.date = exports.resourceIdentifier = exports.publicId = exports.id = void 0;
exports.contributionAutomationBody = exports.contributionPaymentBody = exports.contributionListQuery = exports.contributionDueParams = exports.contributionGenerateBody = exports.contributionSettingBody = exports.technicalJournalParams = exports.technicalJournalQuery = exports.guardianInvitationParams = exports.classListQuery = exports.attachmentDocumentBody = exports.attachmentDisableBody = void 0;
const zod_1 = require("zod");
const text = (max) => zod_1.z.string().trim().min(1).max(max);
const nullableText = (max) => zod_1.z.union([text(max), zod_1.z.literal('').transform(() => null), zod_1.z.null()]);
exports.id = zod_1.z.string().regex(/^[1-9]\d*$/).refine((value) => {
    try {
        return BigInt(value) > 0n;
    }
    catch {
        return false;
    }
}, 'Invalid identifier');
exports.publicId = zod_1.z.string().uuid();
exports.resourceIdentifier = zod_1.z.union([exports.id, exports.publicId]);
exports.date = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}, 'Invalid date');
exports.month = zod_1.z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
exports.time = zod_1.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
exports.page = zod_1.z.string().regex(/^[1-9]\d*$/).optional();
exports.limit = zod_1.z.string().regex(/^[1-9]\d*$/).refine((v) => Number(v) <= 100).optional();
exports.amount = zod_1.z.union([zod_1.z.number().finite().positive(), zod_1.z.string().regex(/^\d+(?:\.\d{1,2})?$/).refine(v => Number(v) > 0 && Number.isFinite(Number(v)))]);
exports.email = zod_1.z.string().trim().toLowerCase().email().max(254);
exports.phone = zod_1.z.string().trim().transform(v => v.replace(/[\s().-]/g, '')).pipe(zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/));
exports.schoolParams = zod_1.z.object({ schoolId: exports.resourceIdentifier }).strict();
exports.studentParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, studentId: exports.resourceIdentifier }).strict();
exports.guardianParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, guardianId: exports.resourceIdentifier }).strict();
exports.guardianLinkParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, studentId: exports.resourceIdentifier, guardianId: exports.resourceIdentifier }).strict();
exports.invoiceParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, invoiceId: exports.publicId }).strict();
exports.loginBody = zod_1.z.object({
    email: zod_1.z.string().trim().max(254).transform(v => v.includes('@') ? v.toLowerCase() : v.replace(/[\s().-]/g, '')),
    password: zod_1.z.string().min(1).max(256),
}).strict();
exports.requestOtpBody = zod_1.z.object({ school_code: text(50), contact: zod_1.z.string().trim().max(254), channel: zod_1.z.enum(['email', 'whatsapp', 'sms']) }).strict();
exports.verifyOtpBody = zod_1.z.object({ verification_id: exports.id, otp: zod_1.z.string().regex(/^\d{6}$/) }).strict();
exports.registerParentBody = zod_1.z.object({ registration_token: zod_1.z.string().min(16).max(2048), password: zod_1.z.string().min(8).max(256) }).strict();
exports.reportBody = zod_1.z.object({
    program_distribution_id: exports.id, teacher_assignment_id: exports.id,
    actual_date: exports.date.optional(), actual_start_time: exports.time.optional(), actual_end_time: exports.time.optional(),
    actual_periods: zod_1.z.number().int().positive().max(24).optional(), lesson_summary: text(4000),
    objectives_achieved: text(4000).optional(), exercises_given: text(4000).optional(),
    homework_given: text(4000).optional(), observations: text(4000).optional(),
}).strict();
exports.reportDecisionBody = zod_1.z.object({ decision: zod_1.z.enum(['validated', 'rejected', 'correction_requested']), observation: text(4000).optional() }).strict();
exports.reportParams = zod_1.z.object({ id: exports.id }).strict();
exports.messageBody = zod_1.z.object({ title: text(200).optional(), message: text(5000), recipient: zod_1.z.enum(['teachers', 'all_teachers', 'all']).optional() }).strict();
exports.itemParams = zod_1.z.object({ id: exports.id }).strict();
exports.emptyQuery = zod_1.z.object({}).strict();
exports.paginationQuery = zod_1.z.object({ page: exports.page, limit: exports.limit }).strict();
exports.schoolListQuery = zod_1.z.object({ page: exports.page, limit: exports.limit, search: zod_1.z.string().trim().max(150).optional(), status: zod_1.z.string().trim().regex(/^[a-z_]{2,30}$/).optional() }).strict();
exports.schoolPublicParams = zod_1.z.object({ schoolId: exports.publicId }).strict();
exports.settingsBody = zod_1.z.object({
    is_enabled: zod_1.z.boolean().optional(), attachment_requires_validation: zod_1.z.boolean().optional(),
    attachment_request_expiry_days: zod_1.z.number().int().min(1).max(365).optional(),
    otp_expiry_minutes: zod_1.z.number().int().min(1).max(1440).optional(), otp_max_attempts: zod_1.z.number().int().min(1).max(20).optional(),
    daily_acknowledgement_required: zod_1.z.boolean().optional(), daily_acknowledgement_deadline: exports.time.nullable().optional(),
}).strict();
exports.subscriptionBody = zod_1.z.object({ unit_price_per_student: exports.amount, school_subscription_id: exports.id.optional() }).strict();
const studentFields = {
    first_name: text(100), last_name: text(100), middle_name: text(100), gender: zod_1.z.enum(['M', 'F', 'm', 'f']).transform(v => v.toUpperCase()),
    birth_date: exports.date, birth_place: text(200), address: text(500), profile_photo: nullableText(2048).optional(),
    status: zod_1.z.enum(['active', 'inactive']).optional(), academic_year_class_id: exports.resourceIdentifier.optional(),
};
exports.createStudentBody = zod_1.z.object(studentFields).strict();
exports.updateStudentBody = zod_1.z.object(studentFields).partial().strict();
exports.studentListQuery = zod_1.z.object({ search: zod_1.z.string().trim().max(200).optional(), academic_year_class_id: exports.id.optional(), status: zod_1.z.enum(['active', 'inactive']).optional(), parental_tracking_enabled: zod_1.z.enum(['true', 'false']).optional(), page: exports.page, limit: exports.limit }).strict();
exports.trackingBody = zod_1.z.object({ enabled: zod_1.z.boolean() }).strict();
const guardianFields = {
    first_name: text(100), last_name: text(100), middle_name: nullableText(100).optional(), phone: exports.phone.nullable().optional(), email: exports.email.nullable().optional(),
    national_id_number: nullableText(100).optional(), occupation: nullableText(150).optional(), address: nullableText(500).optional(),
    preferred_contact_method: zod_1.z.enum(['email', 'phone', 'sms', 'whatsapp']).nullable().optional(), status: zod_1.z.enum(['active', 'inactive']).optional(),
};
exports.createGuardianBody = zod_1.z.object(guardianFields).strict();
exports.updateGuardianBody = zod_1.z.object(guardianFields).partial().strict();
exports.guardianListQuery = zod_1.z.object({ search: zod_1.z.string().trim().max(200).optional(), status: zod_1.z.enum(['active', 'inactive']).optional(), page: exports.page, limit: exports.limit }).strict();
exports.linkGuardianBody = zod_1.z.object({ guardian_id: exports.id, relationship_type: text(100), is_primary: zod_1.z.boolean().optional(), can_receive_alerts: zod_1.z.boolean().optional(), can_view_journal: zod_1.z.boolean().optional() }).strict();
exports.invoiceGenerateBody = zod_1.z.object({ billing_month: exports.month }).strict();
exports.invoiceListQuery = zod_1.z.object({ page: exports.page, limit: exports.limit, status: zod_1.z.enum(['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional() }).strict();
exports.paymentBody = zod_1.z.object({ amount: exports.amount, payment_method: zod_1.z.enum(['cash', 'bank_transfer', 'mobile_money']), transaction_reference: nullableText(200).optional(), notes: nullableText(2000).optional() }).strict();
exports.actionTokenQuery = zod_1.z.object({ token: zod_1.z.string().min(80).max(200) }).strict();
exports.journalQuery = zod_1.z.object({ date: exports.date.optional() }).strict();
exports.acknowledgementBody = zod_1.z.object({ journal_date: exports.date, comment: text(2000).optional() }).strict();
exports.notificationQuery = zod_1.z.object({ page: exports.page, limit: exports.limit, unread: zod_1.z.enum(['true', 'false']).optional() }).strict();
exports.attachmentRequestParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, requestId: exports.publicId }).strict();
exports.attachmentDocumentParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, requestId: exports.publicId, documentId: exports.publicId }).strict();
exports.attachmentRequestQuery = zod_1.z.object({ status: zod_1.z.enum(['BROUILLON', 'EN_ATTENTE', 'APPROUVE', 'REFUSE', 'DESACTIVE']).optional(), search: zod_1.z.string().trim().max(200).optional(), from: exports.date.optional(), to: exports.date.optional(), page: exports.page, limit: exports.limit }).strict();
exports.attachmentDecisionBody = zod_1.z.object({ decision: zod_1.z.enum(['APPROUVE', 'REFUSE']), reason: text(1000).optional() }).strict().superRefine((value, context) => { if (value.decision === 'REFUSE' && !value.reason)
    context.addIssue({ code: 'custom', path: ['reason'], message: 'A refusal reason is required' }); });
exports.attachmentDisableBody = zod_1.z.object({ reason: text(1000) }).strict();
exports.attachmentDocumentBody = zod_1.z.object({ document_type: zod_1.z.enum(['identity', 'parentage', 'other']), file_name: text(255), mime_type: zod_1.z.enum(['application/pdf', 'image/jpeg', 'image/png']), file_size: zod_1.z.number().int().positive(), file_url: zod_1.z.string().url().max(2048).optional(), storage_key: text(500).optional() }).strict().refine(value => value.file_url || value.storage_key, { message: 'External storage reference required' });
exports.classListQuery = zod_1.z.object({ search: zod_1.z.string().trim().max(200).optional(), academic_year: exports.publicId.optional(), section: zod_1.z.string().trim().max(100).optional(), page: exports.page, limit: exports.limit }).strict();
exports.guardianInvitationParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, guardianId: exports.publicId }).strict();
exports.technicalJournalQuery = zod_1.z.object({ date: exports.date.optional(), class_id: exports.publicId.optional(), student_id: exports.publicId.optional(), status: zod_1.z.enum(['vise', 'non_vise']).optional(), page: exports.page, limit: exports.limit }).strict();
exports.technicalJournalParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, journalId: zod_1.z.string().regex(/^[A-Za-z0-9_-]{40,200}$/) }).strict();
exports.contributionSettingBody = zod_1.z.object({ mode: zod_1.z.enum(['PRIS_EN_CHARGE_PAR_ECOLE', 'CONTRIBUTION_PARENT']), monthly_amount: exports.amount.optional(), currency: zod_1.z.string().trim().regex(/^[A-Z]{3}$/).optional(), due_day: zod_1.z.number().int().min(1).max(28).optional(), grace_days: zod_1.z.number().int().min(0).max(60).optional(), reminder_days: zod_1.z.array(zod_1.z.number().int().min(0).max(60)).max(10).optional() }).strict().superRefine((v, c) => { if (v.mode === 'CONTRIBUTION_PARENT' && v.monthly_amount === undefined)
    c.addIssue({ code: 'custom', path: ['monthly_amount'], message: 'Amount required' }); });
exports.contributionGenerateBody = zod_1.z.object({ period: exports.month }).strict();
exports.contributionDueParams = zod_1.z.object({ schoolId: exports.resourceIdentifier, dueId: exports.publicId }).strict();
exports.contributionListQuery = zod_1.z.object({ page: exports.page, limit: exports.limit, period: exports.month.optional(), status: zod_1.z.enum(['PRIS_EN_CHARGE', 'EN_REGLE', 'A_RENOUVELER', 'PARTIEL', 'EN_RETARD', 'SUSPENDU']).optional(), student: exports.publicId.optional() }).strict();
exports.contributionPaymentBody = zod_1.z.object({ amount: exports.amount, payment_method: zod_1.z.enum(['cash', 'bank_transfer', 'mobile_money']), reference: nullableText(150).optional(), notes: nullableText(1000).optional() }).strict();
exports.contributionAutomationBody = zod_1.z.object({}).strict();
