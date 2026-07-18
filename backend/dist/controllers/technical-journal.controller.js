"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexTechnicalJournals = indexTechnicalJournals;
exports.showTechnicalJournal = showTechnicalJournal;
const technical_journal_service_1 = require("../services/technical-journal.service");
const parental_service_1 = require("../services/parental.service");
const value = (input) => typeof input === 'string' ? input : undefined;
const fail = (response, error) => error instanceof parental_service_1.ParentalApiError ? response.status(error.statusCode).json({ message: error.message }) : response.status(500).json({ message: 'Unable to fetch technical journals' });
async function indexTechnicalJournals(request, response) { try {
    return response.json(await (0, technical_journal_service_1.listTechnicalJournals)(request.params.schoolId, { date: value(request.query.date), class_id: value(request.query.class_id), student_id: value(request.query.student_id), status: value(request.query.status), page: value(request.query.page), limit: value(request.query.limit) }));
}
catch (error) {
    return fail(response, error);
} }
async function showTechnicalJournal(request, response) { try {
    return response.json(await (0, technical_journal_service_1.getTechnicalJournal)(request.params.schoolId, request.params.journalId));
}
catch (error) {
    return fail(response, error);
} }
