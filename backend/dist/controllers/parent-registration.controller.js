"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
exports.registerParent = registerParent;
const parent_registration_service_1 = require("../services/parent-registration.service");
const parental_service_1 = require("../services/parental.service");
const abuse_protection_1 = require("../security/abuse-protection");
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function handleError(response, error, fallback) {
    if (error instanceof abuse_protection_1.RateLimitError) {
        response.setHeader('Retry-After', error.retryAfterSeconds);
        return response.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    if (error instanceof parental_service_1.ParentalApiError)
        return response.status(error.statusCode).json({ message: error.message });
    console.error(fallback, error);
    return response.status(500).json({ message: fallback });
}
async function requestOtp(request, response) {
    const input = request.body;
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const contact = (0, abuse_protection_1.normalizeIdentifier)(input.contact);
    const school = (0, abuse_protection_1.normalizeIdentifier)(input.school_code);
    try {
        abuse_protection_1.otpAbuseGuard.request([`otp-ip:${ip}`, `otp-contact:${contact}`, `otp-school:${school}`]);
        const result = await (0, parent_registration_service_1.requestParentRegistrationOtp)(request.body);
        return response.status(202).json((0, abuse_protection_1.publicOtpRequestResponse)(String(result.verification_id), Math.max(1, Math.ceil((result.expires_at.getTime() - Date.now()) / 1000))));
    }
    catch (error) {
        if (error instanceof abuse_protection_1.RateLimitError) {
            console.warn('[SECURITY] OTP request rate limited', { ip, contact: (0, abuse_protection_1.maskContact)(contact), school });
            return handleError(response, error, 'Unable to request registration OTP');
        }
        if (error instanceof parental_service_1.ParentalApiError && (error.statusCode === 404 || error.statusCode === 409)) {
            return response.status(202).json((0, abuse_protection_1.publicOtpRequestResponse)());
        }
        return handleError(response, error, 'Unable to request registration OTP');
    }
}
async function verifyOtp(request, response) {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const input = request.body;
    try {
        abuse_protection_1.otpAbuseGuard.verification([`verify-ip:${ip}`, `verify-id:${(0, abuse_protection_1.fingerprint)(input.verification_id)}`]);
        return response.json(await (0, parent_registration_service_1.verifyParentRegistrationOtp)(request.body));
    }
    catch (error) {
        if (error instanceof abuse_protection_1.RateLimitError) {
            console.warn('[SECURITY] OTP verification rate limited', { ip, verification: (0, abuse_protection_1.fingerprint)(input.verification_id) });
            return handleError(response, error, 'Unable to verify registration OTP');
        }
        if (error instanceof parental_service_1.ParentalApiError && error.statusCode < 500) {
            return response.status(error.statusCode === 429 ? 429 : 400).json({ message: 'Unable to verify code' });
        }
        return handleError(response, error, 'Unable to verify registration OTP');
    }
}
async function registerParent(request, response) {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const input = request.body;
    try {
        abuse_protection_1.otpAbuseGuard.registrationAttempt([`register-ip:${ip}`, `register-token:${(0, abuse_protection_1.fingerprint)(input.registration_token)}`]);
        return response.status(201).json(serialize(await (0, parent_registration_service_1.finalizeParentRegistration)(request.body)));
    }
    catch (error) {
        if (error instanceof abuse_protection_1.RateLimitError) {
            console.warn('[SECURITY] Parent registration rate limited', { ip, token: (0, abuse_protection_1.fingerprint)(input.registration_token) });
            return handleError(response, error, 'Unable to finalize Parent registration');
        }
        return handleError(response, error, 'Unable to finalize Parent registration');
    }
}
