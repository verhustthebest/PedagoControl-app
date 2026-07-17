"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTokenSecret = exports.parentRegistrationTokenSecret = exports.accessTokenSecret = exports.PARENT_TOKEN_AUDIENCE = exports.PARENT_TOKEN_ISSUER = exports.ACCESS_TOKEN_TTL = exports.ACCESS_TOKEN_AUDIENCE = exports.ACCESS_TOKEN_ISSUER = exports.ACCESS_TOKEN_ALGORITHM = void 0;
exports.isStrongTokenSecret = isStrongTokenSecret;
exports.validateTokenConfiguration = validateTokenConfiguration;
exports.ACCESS_TOKEN_ALGORITHM = 'HS256';
const ACCESS_TOKEN_ISSUER = () => process.env.ACCESS_TOKEN_ISSUER ?? 'pedago-control-api';
exports.ACCESS_TOKEN_ISSUER = ACCESS_TOKEN_ISSUER;
const ACCESS_TOKEN_AUDIENCE = () => process.env.ACCESS_TOKEN_AUDIENCE ?? 'pedago-control-frontend';
exports.ACCESS_TOKEN_AUDIENCE = ACCESS_TOKEN_AUDIENCE;
const ACCESS_TOKEN_TTL = () => process.env.ACCESS_TOKEN_TTL ?? '15m';
exports.ACCESS_TOKEN_TTL = ACCESS_TOKEN_TTL;
exports.PARENT_TOKEN_ISSUER = 'pedago-control-parent-registration';
exports.PARENT_TOKEN_AUDIENCE = 'pedago-control-parent-registration-action';
const warned = new Set();
function isStrongTokenSecret(secret) {
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32)
        return false;
    if (/^(.)\1+$/.test(secret) || /^(password|secret|changeme|development)/i.test(secret))
        return false;
    return new Set(secret).size >= 12;
}
function secret(name) {
    const configured = process.env[name];
    if (isStrongTokenSecret(configured))
        return configured;
    if (process.env.NODE_ENV !== 'production' && isStrongTokenSecret(process.env.JWT_SECRET)) {
        if (!warned.has(name)) {
            warned.add(name);
            console.warn(`[SECURITY] ${name} uses the temporary development JWT_SECRET fallback`);
        }
        return process.env.JWT_SECRET;
    }
    throw new Error(`${name} is missing or too weak`);
}
const accessTokenSecret = () => secret('ACCESS_TOKEN_SECRET');
exports.accessTokenSecret = accessTokenSecret;
const parentRegistrationTokenSecret = () => secret('PARENT_REGISTRATION_TOKEN_SECRET');
exports.parentRegistrationTokenSecret = parentRegistrationTokenSecret;
const passwordResetTokenSecret = () => secret('PASSWORD_RESET_TOKEN_SECRET');
exports.passwordResetTokenSecret = passwordResetTokenSecret;
function validateTokenConfiguration() {
    const access = (0, exports.accessTokenSecret)();
    const parent = (0, exports.parentRegistrationTokenSecret)();
    const reset = (0, exports.passwordResetTokenSecret)();
    if (process.env.NODE_ENV === 'production' && (access === parent || access === reset || parent === reset)) {
        throw new Error('Token secrets must be distinct in production');
    }
}
