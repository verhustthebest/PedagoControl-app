"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteParent = inviteParent;
const parent_account_assistance_service_1 = require("../services/parent-account-assistance.service");
const parental_service_1 = require("../services/parental.service");
async function inviteParent(request, response) { try {
    const schoolId = Array.isArray(request.params.schoolId) ? request.params.schoolId[0] : request.params.schoolId, guardianId = Array.isArray(request.params.guardianId) ? request.params.guardianId[0] : request.params.guardianId;
    return response.status(202).json(await (0, parent_account_assistance_service_1.inviteGuardian)(schoolId, guardianId, request.user.id));
}
catch (error) {
    return error instanceof parental_service_1.ParentalApiError ? response.status(error.statusCode).json({ message: error.message }) : response.status(500).json({ message: 'Unable to prepare invitation' });
} }
