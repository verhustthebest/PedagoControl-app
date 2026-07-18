"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContributionSetting = exports.dueDto = exports.settingDto = void 0;
exports.contributionStatus = contributionStatus;
exports.saveContributionSetting = saveContributionSetting;
exports.generateContributionDues = generateContributionDues;
exports.listContributionDues = listContributionDues;
exports.getContributionDue = getContributionDue;
exports.recordContributionPayment = recordContributionPayment;
exports.ownContributions = ownContributions;
exports.auditContributions = auditContributions;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const parental_service_1 = require("./parental.service");
const pageOf = (v) => v ? Number(v) : 1, limitOf = (v) => v ? Number(v) : 20;
const period = (value) => { const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value); if (!m)
    throw new parental_service_1.ParentalApiError('Invalid period', 400); const start = new Date(Date.UTC(+m[1], +m[2] - 1, 1)), end = new Date(Date.UTC(+m[1], +m[2], 0)); return { start, end }; };
const dueInclude = { students: { select: { public_id: true, first_name: true, last_name: true, matricule: true } }, payments: { orderBy: { paid_at: 'desc' }, select: { public_id: true, amount: true, currency: true, payment_method: true, reference: true, notes: true, paid_at: true } } };
/** Calcule un statut d'affichage sans modifier les snapshots financiers historiques. */
function contributionStatus(due, now = new Date()) { if (due.status === 'SUSPENDU' || due.status === 'PRIS_EN_CHARGE')
    return due.status; if (due.amount_paid.greaterThanOrEqualTo(due.amount_due))
    return 'EN_REGLE'; if (due.amount_paid.greaterThan(0))
    return 'PARTIEL'; const grace = new Date(due.due_date); grace.setUTCDate(grace.getUTCDate() + due.grace_days_snapshot); return now.getTime() > grace.getTime() ? 'EN_RETARD' : 'A_RENOUVELER'; }
const settingDto = (s) => s ? { public_id: s.public_id, mode: s.mode, monthly_amount: s.monthly_amount.toString(), currency: s.currency, due_day: s.due_day, grace_days: s.grace_days, reminder_days: s.reminder_days, updated_at: s.updated_at } : null;
exports.settingDto = settingDto;
const dueDto = (d, now = new Date()) => ({ public_id: d.public_id, period_start: d.period_start, period_end: d.period_end, due_date: d.due_date, mode: d.mode_snapshot, amount_due: d.amount_due.toString(), amount_paid: d.amount_paid.toString(), balance: d.balance.toString(), currency: d.currency, status: contributionStatus(d, now), days_remaining: Math.ceil((d.due_date.getTime() - now.getTime()) / 86400000), student: d.students, payments: (d.payments ?? []).map((p) => ({ public_id: p.public_id, amount: p.amount.toString(), currency: p.currency, payment_method: p.payment_method, reference: p.reference, notes: p.notes, paid_at: p.paid_at })) });
exports.dueDto = dueDto;
/** Enregistre la politique future de l'école ; aucune échéance existante n'est recalculée. */
async function saveContributionSetting(schoolId, userId, input) { const mode = input.mode, amount = mode === 'PRIS_EN_CHARGE_PAR_ECOLE' ? new client_1.Prisma.Decimal(0) : new client_1.Prisma.Decimal(input.monthly_amount ?? 0); if (mode === 'CONTRIBUTION_PARENT' && !amount.isPositive())
    throw new parental_service_1.ParentalApiError('Invalid amount', 400); return client_2.default.parent_contribution_settings.upsert({ where: { school_id: BigInt(schoolId) }, create: { school_id: BigInt(schoolId), mode, monthly_amount: amount, currency: input.currency || 'USD', due_day: input.due_day || 5, grace_days: input.grace_days || 0, reminder_days: input.reminder_days || [], created_by_user_id: BigInt(userId), updated_by_user_id: BigInt(userId) }, update: { mode, monthly_amount: amount, currency: input.currency || 'USD', due_day: input.due_day || 5, grace_days: input.grace_days || 0, reminder_days: input.reminder_days || [], updated_by_user_id: BigInt(userId), updated_at: new Date() } }); }
const getContributionSetting = (schoolId) => client_2.default.parent_contribution_settings.findUnique({ where: { school_id: BigInt(schoolId) } });
exports.getContributionSetting = getContributionSetting;
/** Génère au plus une échéance par enfant suivi et période, avec toutes les valeurs figées. */
async function generateContributionDues(schoolId, month) { const setting = await (0, exports.getContributionSetting)(schoolId); if (!setting)
    throw new parental_service_1.ParentalApiError('Contribution setting required', 409); const p = period(month), students = await client_2.default.students.findMany({ where: { school_id: BigInt(schoolId), status: 'active', student_enrollments: { some: { parental_tracking_enabled: true, parental_tracking_started_at: { lte: p.end }, OR: [{ parental_tracking_ended_at: null }, { parental_tracking_ended_at: { gt: p.start } }] } } }, select: { id: true } }); const dueDate = new Date(Date.UTC(p.start.getUTCFullYear(), p.start.getUTCMonth(), Math.min(setting.due_day, p.end.getUTCDate()))), covered = setting.mode === 'PRIS_EN_CHARGE_PAR_ECOLE'; let created = 0; for (const student of students) {
    try {
        await client_2.default.parent_contribution_dues.create({ data: { school_id: BigInt(schoolId), student_id: student.id, setting_id: setting.id, period_start: p.start, period_end: p.end, due_date: dueDate, mode_snapshot: setting.mode, amount_due: setting.monthly_amount, amount_paid: 0, balance: setting.monthly_amount, currency: setting.currency, grace_days_snapshot: setting.grace_days, reminder_days_snapshot: setting.reminder_days, status: covered ? 'PRIS_EN_CHARGE' : 'A_RENOUVELER' } });
        created++;
    }
    catch (e) {
        if (!(e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002'))
            throw e;
    }
} return { created }; }
async function listContributionDues(schoolId, input = {}) { const page = pageOf(input.page), limit = limitOf(input.limit), where = { school_id: BigInt(schoolId), ...(input.period ? { period_start: period(input.period).start } : {}), ...(input.student ? { students: { public_id: input.student } } : {}) }; const [dues, total] = await client_2.default.$transaction([client_2.default.parent_contribution_dues.findMany({ where, include: dueInclude, orderBy: { due_date: 'desc' }, skip: (page - 1) * limit, take: limit }), client_2.default.parent_contribution_dues.count({ where })]); const items = dues.map(d => (0, exports.dueDto)(d)).filter(d => !input.status || d.status === input.status); return { dues: items, pagination: { page, limit, total: input.status ? items.length : total, total_pages: Math.ceil((input.status ? items.length : total) / limit) } }; }
async function getContributionDue(schoolId, publicId) { const due = await client_2.default.parent_contribution_dues.findFirst({ where: { school_id: BigInt(schoolId), public_id: publicId }, include: dueInclude }); if (!due)
    throw new parental_service_1.ParentalApiError('Resource not found', 404); return due; }
/** Ajoute un paiement immuable et actualise uniquement les cumuls de l'échéance ciblée. */
async function recordContributionPayment(schoolId, publicId, userId, input) { return client_2.default.$transaction(async (tx) => { const due = await tx.parent_contribution_dues.findFirst({ where: { school_id: BigInt(schoolId), public_id: publicId } }); if (!due || due.mode_snapshot !== 'CONTRIBUTION_PARENT')
    throw new parental_service_1.ParentalApiError('Resource not found', 404); const amount = new client_1.Prisma.Decimal(input.amount), paid = due.amount_paid.add(amount); if (!amount.isPositive() || paid.greaterThan(due.amount_due))
    throw new parental_service_1.ParentalApiError('Invalid payment amount', 409); const payment = await tx.parent_contribution_payments.create({ data: { due_id: due.id, amount, currency: due.currency, payment_method: input.payment_method, reference: input.reference, notes: input.notes, recorded_by_user_id: BigInt(userId) } }); await tx.parent_contribution_dues.update({ where: { id: due.id }, data: { amount_paid: paid, balance: due.amount_due.sub(paid), status: paid.equals(due.amount_due) ? 'EN_REGLE' : 'PARTIEL', updated_at: new Date() } }); return payment; }); }
async function ownContributions(userId) { const guardian = await client_2.default.guardians.findFirst({ where: { user_id: BigInt(userId), status: 'active' } }); if (!guardian)
    throw new parental_service_1.ParentalApiError('Access forbidden', 403); const dues = await client_2.default.parent_contribution_dues.findMany({ where: { school_id: guardian.school_id, students: { student_guardians: { some: { guardian_id: guardian.id, status: 'active', validated_at: { not: null } } } } }, include: dueInclude, orderBy: { due_date: 'desc' } }); return { dues: dues.map(d => (0, exports.dueDto)(d)), summary: { balance: dues.reduce((n, d) => n.add(d.balance), new client_1.Prisma.Decimal(0)).toString(), next_due_date: dues.find(d => d.balance.greaterThan(0))?.due_date ?? null } }; }
async function auditContributions(input) { const page = pageOf(input.page), limit = limitOf(input.limit); const [dues, total] = await client_2.default.$transaction([client_2.default.parent_contribution_dues.findMany({ include: { ...dueInclude, schools: { select: { public_id: true, name: true } } }, orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit }), client_2.default.parent_contribution_dues.count()]); return { dues: dues.map(d => ({ ...(0, exports.dueDto)(d), school: d.schools })), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } }; }
