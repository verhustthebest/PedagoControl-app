"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccountEligible = isAccountEligible;
exports.loginWithEmailAndPassword = loginWithEmailAndPassword;
exports.signAccessToken = signAccessToken;
exports.findAuthUserById = findAuthUserById;
exports.verifyAuthToken = verifyAuthToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const client_1 = __importDefault(require("../prisma/client"));
const token_security_1 = require("../config/token-security");
function isAccountEligible(user) {
    return user.is_active && (!user.school_id || user.schools?.status === 'active') && user.activeRoleCount > 0;
}
function formatUser(user) {
    return {
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        school_id: user.school_id ? user.school_id.toString() : null,
        roles: user.user_roles
            .filter((userRole) => userRole.roles.is_active)
            .map((userRole) => userRole.roles.name),
        permissions: [
            ...new Set(user.user_roles
                .filter((userRole) => userRole.roles.is_active)
                .flatMap((userRole) => userRole.roles.role_permissions
                .filter((rolePermission) => rolePermission.permissions.is_active)
                .map((rolePermission) => rolePermission.permissions.code))),
        ],
        modules: {
            pedagogical_control: true,
            parental_tracking: Boolean(user.schools?.school_parental_settings?.is_enabled),
        },
    };
}
async function loginWithEmailAndPassword(email, password) {
    const identifier = email.trim();
    const user = await client_1.default.users.findFirst({
        where: {
            OR: [
                { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
                { phone: identifier },
            ],
        },
        include: {
            schools: { select: { status: true, school_parental_settings: { select: { is_enabled: true } } } },
            user_roles: {
                include: {
                    roles: {
                        include: {
                            role_permissions: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!user || !isAccountEligible({
        is_active: user.is_active,
        school_id: user.school_id,
        schools: user.schools,
        activeRoleCount: user.user_roles.filter(item => item.roles.is_active).length,
    })) {
        return null;
    }
    const passwordIsValid = await bcrypt_1.default.compare(password, user.password_hash);
    if (!passwordIsValid) {
        return null;
    }
    const authUser = formatUser(user);
    return {
        user: authUser,
        roles: authUser.roles,
        school_id: authUser.school_id,
    };
}
function signAccessToken(authUser, sessionId) {
    const payload = {
        sub: authUser.id,
        roles: authUser.roles,
        school_id: authUser.school_id,
        token_type: 'access',
        jti: (0, crypto_1.randomUUID)(),
        sid: sessionId,
    };
    const token = jsonwebtoken_1.default.sign(payload, (0, token_security_1.accessTokenSecret)(), {
        algorithm: token_security_1.ACCESS_TOKEN_ALGORITHM,
        expiresIn: (0, token_security_1.ACCESS_TOKEN_TTL)(),
        issuer: (0, token_security_1.ACCESS_TOKEN_ISSUER)(), audience: (0, token_security_1.ACCESS_TOKEN_AUDIENCE)(),
    });
    return token;
}
async function findAuthUserById(userId) {
    const user = await client_1.default.users.findUnique({
        where: { id: BigInt(userId) },
        include: {
            schools: { select: { status: true, school_parental_settings: { select: { is_enabled: true } } } },
            user_roles: {
                include: {
                    roles: {
                        include: {
                            role_permissions: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!user || !isAccountEligible({
        is_active: user.is_active,
        school_id: user.school_id,
        schools: user.schools,
        activeRoleCount: user.user_roles.filter(item => item.roles.is_active).length,
    })) {
        return null;
    }
    return formatUser(user);
}
function verifyAuthToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, (0, token_security_1.accessTokenSecret)(), {
        algorithms: [token_security_1.ACCESS_TOKEN_ALGORITHM], issuer: (0, token_security_1.ACCESS_TOKEN_ISSUER)(), audience: (0, token_security_1.ACCESS_TOKEN_AUDIENCE)(),
    });
    if (payload.token_type !== 'access' || !payload.sub || !payload.jti || !payload.sid || !Array.isArray(payload.roles)) {
        throw new Error('Invalid access token');
    }
    return payload;
}
