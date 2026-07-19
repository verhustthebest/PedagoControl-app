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
exports.runAutomation = runAutomation;
const parent_contribution_automation_service_1 = require("../services/parent-contribution-automation.service");
const parent_contribution_service_1 = require("../services/parent-contribution.service");
const parental_service_1 = require("../services/parental.service");
const queryString = (value) => typeof value === 'string' ? value : undefined;
const schoolId = (request) => request.params.schoolId;
const fail = (response, error) => error instanceof parental_service_1.ParentalApiError
    ? response.status(error.statusCode).json({ message: error.message })
    : response.status(500).json({ message: 'Unable to process contribution' });
async function showSetting(request, response) { try {
    return response.json({ setting: (0, parent_contribution_service_1.settingDto)(await (0, parent_contribution_service_1.getContributionSetting)(schoolId(request))) });
}
catch (error) {
    return fail(response, error);
} }
async function saveSetting(request, response) { try {
    return response.json({ setting: (0, parent_contribution_service_1.settingDto)(await (0, parent_contribution_service_1.saveContributionSetting)(schoolId(request), request.user.id, request.body)) });
}
catch (error) {
    return fail(response, error);
} }
async function generateDues(request, response) { try {
    return response.status(201).json(await (0, parent_contribution_service_1.generateContributionDues)(schoolId(request), request.body.period));
}
catch (error) {
    return fail(response, error);
} }
async function indexDues(request, response) { try {
    return response.json(await (0, parent_contribution_service_1.listContributionDues)(schoolId(request), { page: queryString(request.query.page), limit: queryString(request.query.limit), period: queryString(request.query.period), status: queryString(request.query.status), student: queryString(request.query.student) }));
}
catch (error) {
    return fail(response, error);
} }
async function showDue(request, response) { try {
    return response.json({ due: (0, parent_contribution_service_1.dueDto)(await (0, parent_contribution_service_1.getContributionDue)(schoolId(request), request.params.dueId)) });
}
catch (error) {
    return fail(response, error);
} }
async function createPayment(request, response) { try {
    const payment = await (0, parent_contribution_service_1.recordContributionPayment)(schoolId(request), request.params.dueId, request.user.id, request.body);
    return response.status(201).json({ payment: { public_id: payment.public_id, amount: payment.amount.toString(), currency: payment.currency, payment_method: payment.payment_method, reference: payment.reference, notes: payment.notes, paid_at: payment.paid_at } });
}
catch (error) {
    return fail(response, error);
} }
async function paymentHistory(request, response) { try {
    const due = (0, parent_contribution_service_1.dueDto)(await (0, parent_contribution_service_1.getContributionDue)(schoolId(request), request.params.dueId));
    return response.json({ payments: due.payments });
}
catch (error) {
    return fail(response, error);
} }
async function ownView(request, response) { try {
    return response.json(await (0, parent_contribution_service_1.ownContributions)(request.user.id));
}
catch (error) {
    return fail(response, error);
} }
async function auditView(request, response) { try {
    return response.json(await (0, parent_contribution_service_1.auditContributions)({ page: queryString(request.query.page), limit: queryString(request.query.limit) }));
}
catch (error) {
    return fail(response, error);
} }
/** Déclenchement manuel global, réservé au SUPER_ADMIN par la route. */
async function runAutomation(_request, response) { try {
    return response.json(await (0, parent_contribution_automation_service_1.runParentContributionAutomation)());
}
catch (error) {
    return fail(response, error);
} }
