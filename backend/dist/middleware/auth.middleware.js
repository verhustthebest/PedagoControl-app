"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateBearerToken = authenticateBearerToken;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.requireAnyRole = requireAnyRole;
exports.requireSchoolContext = requireSchoolContext;
exports.requireSchoolScope = requireSchoolScope;
const auth_service_1 = require("../services/auth.service");
const crypto_1 = require("crypto");
const access_policy_1 = require("../security/access-policy");
async function authenticateBearerToken(request, response, next) {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Authentication required' });
    }
    const token = authorization.slice('Bearer '.length).trim();
    try {
        const payload = (0, auth_service_1.verifyAuthToken)(token);
        const user = await (0, auth_service_1.findAuthUserById)(payload.sub);
        if (!user || user.school_id !== payload.school_id) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        request.user = user;
        return next();
    }
    catch {
        const requestId = request.header('X-Request-ID')?.slice(0, 100) || (0, crypto_1.randomUUID)();
        response.setHeader('X-Request-ID', requestId);
        console.warn('[SECURITY] access token rejected', { request_id: requestId });
        return response.status(401).json({ message: 'Authentication required' });
    }
}
function requirePermission(code) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        if ((0, access_policy_1.isSuperAdmin)(request.user) || request.user.permissions.includes(code)) {
            return next();
        }
        return response.status(403).json({ message: 'Access forbidden' });
    };
}
function requireRole(role) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        if (!request.user.roles.includes(role)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        return next();
    };
}
function requireAnyRole(roles) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        if (!(0, access_policy_1.hasAnyRole)(request.user, roles)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        return next();
    };
}
function requireSchoolContext() {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        if (!(0, access_policy_1.hasUsableSchoolContext)(request.user)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        return next();
    };
}
function requireSchoolScope(parameterName = 'schoolId') {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        const rawSchoolId = request.params[parameterName];
        const requestedSchoolId = Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId;
        if (!requestedSchoolId || !/^\d+$/.test(requestedSchoolId) || BigInt(requestedSchoolId) <= 0n) {
            return response.status(400).json({ message: 'A valid school id is required' });
        }
        if (!request.user.school_id && !(0, access_policy_1.isSuperAdmin)(request.user)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        if (request.user.school_id && BigInt(request.user.school_id) !== BigInt(requestedSchoolId)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        return next();
    };
}
