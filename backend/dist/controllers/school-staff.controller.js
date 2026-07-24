"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
exports.acceptInvitation = acceptInvitation;
exports.listStaff = listStaff;
exports.updateStaff = updateStaff;
exports.deactivateStaff = deactivateStaff;
exports.setAssignments = setAssignments;
const school_staff_service_1 = require("../services/school-staff.service");
const phone_identity_1 = require("../security/phone-identity");
async function createStaff(request, response) {
    try {
        const requestId = String(response.getHeader('X-Request-ID') || '');
        const staff = await (0, school_staff_service_1.createSchoolStaff)(BigInt(request.params.schoolId), request.body, request.user.id, requestId);
        return response.status(201).json({ staff, request_id: requestId });
    }
    catch (error) {
        if (error instanceof school_staff_service_1.SchoolStaffError)
            return response.status(error.status).json({ message: error.message });
        if (error instanceof phone_identity_1.PhoneIdentityError)
            return response.status(error.status).json({ message: error.message });
        return response.status(400).json({ message: 'Impossible de créer ce compte.' });
    }
}
async function acceptInvitation(request, response) {
    try {
        return response.json(await (0, school_staff_service_1.acceptStaffInvitation)(request.body.token, request.body.password));
    }
    catch (error) {
        return response.status(error instanceof school_staff_service_1.SchoolStaffError ? error.status : 400).json({ message: 'Invitation invalide ou expirée.' });
    }
}
async function listStaff(request, response) { const page = Number(request.query.page || 1), limit = Number(request.query.limit || 20); return response.json(await (0, school_staff_service_1.listSchoolStaff)(BigInt(request.params.schoolId), { role: request.query.role, search: request.query.search, page, limit })); }
async function updateStaff(request, response) { try {
    return response.json({ staff: await (0, school_staff_service_1.updateSchoolStaff)(BigInt(request.params.schoolId), request.params.staffId, request.body) });
}
catch (error) {
    if (error instanceof school_staff_service_1.SchoolStaffError)
        return response.status(error.status).json({ message: error.message });
    if (error instanceof phone_identity_1.PhoneIdentityError)
        return response.status(error.status).json({ message: error.message });
    return response.status(400).json({ message: 'Impossible de modifier ce compte.' });
} }
async function deactivateStaff(request, response) { try {
    return response.json({ staff: await (0, school_staff_service_1.updateSchoolStaff)(BigInt(request.params.schoolId), request.params.staffId, { is_active: false }) });
}
catch (error) {
    return response.status(error instanceof school_staff_service_1.SchoolStaffError ? error.status : 400).json({ message: error instanceof school_staff_service_1.SchoolStaffError ? error.message : 'Impossible de désactiver ce compte.' });
} }
async function setAssignments(request, response) { try {
    return response.json(await (0, school_staff_service_1.assignTeacher)(BigInt(request.params.schoolId), request.params.staffId, request.body.class_subject_ids, request.user.id));
}
catch (error) {
    return response.status(error instanceof school_staff_service_1.SchoolStaffError ? error.status : 400).json({ message: error instanceof school_staff_service_1.SchoolStaffError ? error.message : 'Affectation impossible.' });
} }
