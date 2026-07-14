"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateBearerToken = authenticateBearerToken;
exports.requirePermission = requirePermission;
exports.requireSchoolScope = requireSchoolScope;
const auth_service_1 = require("../services/auth.service");
async function authenticateBearerToken(request, response, next) {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Bearer token required' });
    }
    const token = authorization.slice('Bearer '.length).trim();
    try {
        const payload = (0, auth_service_1.verifyAuthToken)(token);
        const user = await (0, auth_service_1.findAuthUserById)(payload.sub);
        if (!user) {
            return response.status(401).json({ message: 'Invalid token user' });
        }
        request.user = user;
        return next();
    }
    catch {
        return response.status(401).json({ message: 'Invalid or expired token' });
    }
}
function requirePermission(code) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        if (request.user.roles.includes('SUPER_ADMIN') || request.user.permissions.includes(code)) {
            return next();
        }
        return response.status(403).json({ message: `Permission required: ${code}` });
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
        if (request.user.school_id && BigInt(request.user.school_id) !== BigInt(requestedSchoolId)) {
            return response.status(403).json({ message: 'Access to another school is forbidden' });
        }
        return next();
    };
}
