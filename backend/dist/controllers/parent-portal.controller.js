"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownChildren = ownChildren;
exports.ownChildJournals = ownChildJournals;
exports.acknowledgeJournal = acknowledgeJournal;
exports.ownNotifications = ownNotifications;
const parent_portal_service_1 = require("../services/parent-portal.service");
const parental_service_1 = require("../services/parental.service");
function parameter(request, name) {
    const value = request.params[name];
    return Array.isArray(value) ? value[0] : value;
}
function query(value) {
    return typeof value === 'string' ? value : undefined;
}
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function handleError(response, error, fallback) {
    if (error instanceof parental_service_1.ParentalApiError)
        return response.status(error.statusCode).json({ message: error.message });
    console.error(fallback, error);
    return response.status(500).json({ message: fallback });
}
async function ownChildren(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        return response.json(serialize(await (0, parent_portal_service_1.getOwnChildren)(request.user.id)));
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch own children');
    }
}
async function ownChildJournals(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const result = await (0, parent_portal_service_1.getOwnChildJournals)(request.user.id, parameter(request, 'studentId'), query(request.query.date));
        return response.json(serialize(result));
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch child journals');
    }
}
async function acknowledgeJournal(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const acknowledgement = await (0, parent_portal_service_1.acknowledgeOwnChildJournal)(request.user.id, parameter(request, 'studentId'), request.body?.journal_date, {
            ipAddress: request.ip,
            userAgent: request.header('User-Agent'),
            comment: request.body?.comment,
        });
        return response.status(201).json({ acknowledgement: serialize(acknowledgement) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to acknowledge daily journal');
    }
}
async function ownNotifications(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const result = await (0, parent_portal_service_1.getOwnNotifications)(request.user.id, {
            page: query(request.query.page),
            limit: query(request.query.limit),
            unread: query(request.query.unread),
        });
        return response.json(serialize(result));
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch own notifications');
    }
}
