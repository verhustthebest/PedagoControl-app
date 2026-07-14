"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginWithEmailAndPassword = loginWithEmailAndPassword;
exports.findAuthUserById = findAuthUserById;
exports.verifyAuthToken = verifyAuthToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../prisma/client"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
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
    };
}
async function loginWithEmailAndPassword(email, password) {
    const user = await client_1.default.users.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: {
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
    if (!user || !user.is_active) {
        return null;
    }
    const passwordIsValid = await bcrypt_1.default.compare(password, user.password_hash);
    if (!passwordIsValid) {
        return null;
    }
    const authUser = formatUser(user);
    const payload = {
        sub: authUser.id,
        email: authUser.email,
        roles: authUser.roles,
        school_id: authUser.school_id,
    };
    const token = jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: '8h' });
    return {
        token,
        user: authUser,
        roles: authUser.roles,
        school_id: authUser.school_id,
    };
}
async function findAuthUserById(userId) {
    const user = await client_1.default.users.findUnique({
        where: { id: BigInt(userId) },
        include: {
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
    if (!user || !user.is_active) {
        return null;
    }
    return formatUser(user);
}
function verifyAuthToken(token) {
    return jsonwebtoken_1.default.verify(token, getJwtSecret());
}
