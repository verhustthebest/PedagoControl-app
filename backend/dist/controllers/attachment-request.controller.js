"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.index = index;
exports.show = show;
exports.decide = decide;
exports.disable = disable;
exports.addDocument = addDocument;
exports.removeDocument = removeDocument;
const attachment_request_service_1 = require("../services/attachment-request.service");
const parental_service_1 = require("../services/parental.service");
const p = (r, n) => Array.isArray(r.params[n]) ? r.params[n][0] : r.params[n];
const q = (v) => typeof v === 'string' ? v : undefined;
const fail = (res, e) => e instanceof parental_service_1.ParentalApiError ? res.status(e.statusCode).json({ message: e.message }) : res.status(500).json({ message: 'Unable to process attachment request' });
async function create(r, res) { try {
    return res.status(201).json({ request: await (0, attachment_request_service_1.createAttachmentRequest)(p(r, 'schoolId'), r.user.id, r.body) });
}
catch (e) {
    return fail(res, e);
} }
async function index(r, res) { try {
    return res.json(await (0, attachment_request_service_1.listAttachmentRequests)(p(r, 'schoolId'), { status: q(r.query.status), search: q(r.query.search), from: q(r.query.from), to: q(r.query.to), page: q(r.query.page), limit: q(r.query.limit) }));
}
catch (e) {
    return fail(res, e);
} }
async function show(r, res) { try {
    return res.json({ request: await (0, attachment_request_service_1.getAttachmentRequest)(p(r, 'schoolId'), p(r, 'requestId')) });
}
catch (e) {
    return fail(res, e);
} }
async function decide(r, res) { try {
    return res.json({ request: await (0, attachment_request_service_1.decideAttachmentRequest)(p(r, 'schoolId'), p(r, 'requestId'), r.user.id, r.body.decision, r.body.reason) });
}
catch (e) {
    return fail(res, e);
} }
async function disable(r, res) { try {
    return res.json({ request: await (0, attachment_request_service_1.disableAttachment)(p(r, 'schoolId'), p(r, 'requestId'), r.user.id, r.body.reason) });
}
catch (e) {
    return fail(res, e);
} }
async function addDocument(r, res) { try {
    return res.status(201).json({ document: await (0, attachment_request_service_1.addAttachmentDocument)(p(r, 'schoolId'), p(r, 'requestId'), r.user.id, r.body) });
}
catch (e) {
    return fail(res, e);
} }
async function removeDocument(r, res) { try {
    await (0, attachment_request_service_1.removeAttachmentDocument)(p(r, 'schoolId'), p(r, 'requestId'), p(r, 'documentId'));
    return res.status(204).end();
}
catch (e) {
    return fail(res, e);
} }
