"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateBearerToken = authenticateBearerToken;
exports.requirePermission = requirePermission;
exports.requireRole = requireRole;
exports.requireAnyRole = requireAnyRole;
exports.requireSchoolContext = requireSchoolContext;
exports.requireSchoolScope = requireSchoolScope;
const auth_service_1 = require("../services/auth.service");
const auth_session_service_1 = require("../services/auth-session.service");
const request_context_middleware_1 = require("./request-context.middleware");
const client_1 = __importDefault(require("../prisma/client"));
const public_id_1 = require("../security/public-id");
const access_policy_1 = require("../security/access-policy");
async function authenticateBearerToken(request, response, next) {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Authentication required' });
    }
    const token = authorization.slice('Bearer '.length).trim();
    try {
        const payload = (0, auth_service_1.verifyAuthToken)(token);
        const [user, sessionActive] = await Promise.all([
            (0, auth_service_1.findAuthUserById)(payload.sub), (0, auth_session_service_1.assertActiveSession)(payload.sid, payload.sub),
        ]);
        if (!user && sessionActive)
            await (0, auth_session_service_1.revokeSession)(payload.sid);
        if (!user || !sessionActive || user.school_id !== payload.school_id) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        request.user = user;
        request.session_id = payload.sid;
        return next();
    }
    catch {
        (0, request_context_middleware_1.securityLog)(request, 'access_token_rejected', 'denied');
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
    return async (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: 'Authentication required' });
        }
        const rawSchoolId = request.params[parameterName];
        const requestedSchoolId = Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId;
        if (!requestedSchoolId || (!/^\d+$/.test(requestedSchoolId) && !(0, public_id_1.isPublicId)(requestedSchoolId))) {
            return response.status(400).json({ message: 'A valid school id is required' });
        }
        let internalSchoolId;
        if ((0, public_id_1.isPublicId)(requestedSchoolId)) {
            const school = await client_1.default.schools.findUnique({ where: { public_id: requestedSchoolId }, select: { id: true } });
            if (!school)
                return response.status(404).json({ message: 'Resource not found' });
            internalSchoolId = school.id;
        }
        else {
            internalSchoolId = BigInt(requestedSchoolId);
            if (internalSchoolId <= 0n)
                return response.status(400).json({ message: 'A valid school id is required' });
        }
        if (!request.user.school_id && !(0, access_policy_1.isSuperAdmin)(request.user)) {
            return response.status(403).json({ message: 'Access forbidden' });
        }
        if (request.user.school_id && BigInt(request.user.school_id) !== internalSchoolId) {
            response.locals = response.locals ?? {};
            response.locals.security_action = 'cross_school_access_refused';
            return response.status(404).json({ message: 'Resource not found' });
        }
        request.params[parameterName] = internalSchoolId.toString();
        return next();
    };
}
