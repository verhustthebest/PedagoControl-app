"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexGuardians = indexGuardians;
exports.createGuardianHandler = createGuardianHandler;
exports.showGuardian = showGuardian;
exports.updateGuardianHandler = updateGuardianHandler;
exports.linkGuardian = linkGuardian;
exports.updateGuardianLink = updateGuardianLink;
const parental_guardian_service_1 = require("../services/parental-guardian.service");
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
    return response.status(500).json({ message: fallback });
}
async function indexGuardians(request, response) {
    try {
        const result = await (0, parental_guardian_service_1.listGuardians)(parameter(request, 'schoolId'), {
            search: query(request.query.search),
            status: query(request.query.status),
            page: query(request.query.page),
            limit: query(request.query.limit),
        });
        return response.json(serialize(result));
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch guardians');
    }
}
async function createGuardianHandler(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const guardian = await (0, parental_guardian_service_1.createGuardian)(parameter(request, 'schoolId'), request.user.id, request.body);
        return response.status(201).json({ guardian: serialize(guardian) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to create guardian');
    }
}
async function showGuardian(request, response) {
    try {
        const guardian = await (0, parental_guardian_service_1.getGuardian)(parameter(request, 'schoolId'), parameter(request, 'guardianId'));
        return response.json({ guardian: serialize(guardian) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch guardian');
    }
}
async function updateGuardianHandler(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const guardian = await (0, parental_guardian_service_1.updateGuardian)(parameter(request, 'schoolId'), parameter(request, 'guardianId'), request.user.id, request.body);
        return response.json({ guardian: serialize(guardian) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update guardian');
    }
}
async function linkGuardian(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const link = await (0, parental_guardian_service_1.linkGuardianToStudent)(parameter(request, 'schoolId'), parameter(request, 'studentId'), request.user.id, request.body);
        return response.status(201).json({ link: serialize(link) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to link guardian to student');
    }
}
async function updateGuardianLink(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const link = await (0, parental_guardian_service_1.setStudentGuardianEnabled)(parameter(request, 'schoolId'), parameter(request, 'studentId'), parameter(request, 'guardianId'), request.user.id, request.body?.enabled);
        return response.json({ link: serialize(link) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update guardian link');
    }
}
