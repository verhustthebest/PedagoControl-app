"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showSetting = showSetting;
exports.saveSetting = saveSetting;
exports.generateDues = generateDues;
exports.indexDues = indexDues;
exports.showDue = showDue;
exports.createPayment = createPayment;
exports.paymentHistory = paymentHistory;
exports.ownView = ownView;
exports.auditView = auditView;
const parent_contribution_service_1 = require("../services/parent-contribution.service");
const parental_service_1 = require("../services/parental.service");
const q = (v) => typeof v === 'string' ? v : undefined, fail = (r, e) => e instanceof parental_service_1.ParentalApiError ? r.status(e.statusCode).json({ message: e.message }) : r.status(500).json({ message: 'Unable to process contribution' });
const school = (r) => r.params.schoolId;
async function showSetting(r, s) { try {
    return s.json({ setting: (0, parent_contribution_service_1.settingDto)(await (0, parent_contribution_service_1.getContributionSetting)(school(r))) });
}
catch (e) {
    return fail(s, e);
} }
async function saveSetting(r, s) { try {
    return s.json({ setting: (0, parent_contribution_service_1.settingDto)(await (0, parent_contribution_service_1.saveContributionSetting)(school(r), r.user.id, r.body)) });
}
catch (e) {
    return fail(s, e);
} }
async function generateDues(r, s) { try {
    return s.status(201).json(await (0, parent_contribution_service_1.generateContributionDues)(school(r), r.body.period));
}
catch (e) {
    return fail(s, e);
} }
async function indexDues(r, s) { try {
    return s.json(await (0, parent_contribution_service_1.listContributionDues)(school(r), { page: q(r.query.page), limit: q(r.query.limit), period: q(r.query.period), status: q(r.query.status), student: q(r.query.student) }));
}
catch (e) {
    return fail(s, e);
} }
async function showDue(r, s) { try {
    return s.json({ due: (0, parent_contribution_service_1.dueDto)(await (0, parent_contribution_service_1.getContributionDue)(school(r), r.params.dueId)) });
}
catch (e) {
    return fail(s, e);
} }
async function createPayment(r, s) { try {
    const payment = await (0, parent_contribution_service_1.recordContributionPayment)(school(r), r.params.dueId, r.user.id, r.body);
    return s.status(201).json({ payment: { public_id: payment.public_id, amount: payment.amount.toString(), currency: payment.currency, payment_method: payment.payment_method, reference: payment.reference, notes: payment.notes, paid_at: payment.paid_at } });
}
catch (e) {
    return fail(s, e);
} }
async function paymentHistory(r, s) { try {
    const due = (0, parent_contribution_service_1.dueDto)(await (0, parent_contribution_service_1.getContributionDue)(school(r), r.params.dueId));
    return s.json({ payments: due.payments });
}
catch (e) {
    return fail(s, e);
} }
async function ownView(r, s) { try {
    return s.json(await (0, parent_contribution_service_1.ownContributions)(r.user.id));
}
catch (e) {
    return fail(s, e);
} }
async function auditView(r, s) { try {
    return s.json(await (0, parent_contribution_service_1.auditContributions)({ page: q(r.query.page), limit: q(r.query.limit) }));
}
catch (e) {
    return fail(s, e);
} }
