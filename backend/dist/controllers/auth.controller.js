"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
const auth_service_1 = require("../services/auth.service");
const abuse_protection_1 = require("../security/abuse-protection");
const PUBLIC_LOGIN_ERROR = 'Authentication failed';
async function login(request, response) {
    const { email, password } = request.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return response.status(400).json({ message: PUBLIC_LOGIN_ERROR });
    }
    const identifier = (0, abuse_protection_1.normalizeIdentifier)(email);
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    try {
        abuse_protection_1.loginAbuseGuard.begin(ip, identifier);
        const session = await (0, auth_service_1.loginWithEmailAndPassword)(email, password);
        if (!session) {
            const delay = abuse_protection_1.loginAbuseGuard.failed(ip, identifier);
            if (delay > 0)
                console.warn('[SECURITY] progressive login delay', { ip, identifier: (0, abuse_protection_1.maskContact)(identifier), delay });
            await (0, abuse_protection_1.wait)(delay);
            return response.status(401).json({ message: PUBLIC_LOGIN_ERROR });
        }
        abuse_protection_1.loginAbuseGuard.succeeded(ip, identifier);
        return response.json(session);
    }
    catch (error) {
        if (error instanceof abuse_protection_1.RateLimitError) {
            console.warn('[SECURITY] login rate limited', { ip, identifier: (0, abuse_protection_1.maskContact)(identifier) });
            response.setHeader('Retry-After', error.retryAfterSeconds);
            return response.status(429).json({ message: 'Too many requests. Please try again later.' });
        }
        console.error('Unable to login', error);
        return response.status(500).json({ message: PUBLIC_LOGIN_ERROR });
    }
}
function me(request, response) {
    return response.json({
        user: request.user,
        roles: request.user?.roles ?? [],
        permissions: request.user?.permissions ?? [],
        school_id: request.user?.school_id ?? null,
    });
}
