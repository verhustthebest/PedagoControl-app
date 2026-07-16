"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
exports.registerParent = registerParent;
const parent_registration_service_1 = require("../services/parent-registration.service");
const parental_service_1 = require("../services/parental.service");
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function handleError(response, error, fallback) {
    if (error instanceof parental_service_1.ParentalApiError)
        return response.status(error.statusCode).json({ message: error.message });
    console.error(fallback, error);
    return response.status(500).json({ message: fallback });
}
async function requestOtp(request, response) {
    try {
        return response.status(201).json(serialize(await (0, parent_registration_service_1.requestParentRegistrationOtp)(request.body)));
    }
    catch (error) {
        return handleError(response, error, 'Unable to request registration OTP');
    }
}
async function verifyOtp(request, response) {
    try {
        return response.json(await (0, parent_registration_service_1.verifyParentRegistrationOtp)(request.body));
    }
    catch (error) {
        return handleError(response, error, 'Unable to verify registration OTP');
    }
}
async function registerParent(request, response) {
    try {
        return response.status(201).json(serialize(await (0, parent_registration_service_1.finalizeParentRegistration)(request.body)));
    }
    catch (error) {
        return handleError(response, error, 'Unable to finalize Parent registration');
    }
}
