"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.csrf = csrf;
exports.refresh = refresh;
exports.logout = logout;
exports.logoutAll = logoutAll;
exports.me = me;
const auth_service_1 = require("../services/auth.service");
const auth_session_service_1 = require("../services/auth-session.service");
const request_context_middleware_1 = require("../middleware/request-context.middleware");
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
        const credentials = await (0, auth_service_1.loginWithEmailAndPassword)(email, password);
        if (!credentials) {
            const delay = abuse_protection_1.loginAbuseGuard.failed(ip, identifier);
            await (0, abuse_protection_1.wait)(delay);
            (0, request_context_middleware_1.securityLog)(request, 'login_failed', 'denied', { ip, email: identifier, delay_ms: delay });
            return response.status(401).json({ message: PUBLIC_LOGIN_ERROR });
        }
        abuse_protection_1.loginAbuseGuard.succeeded(ip, identifier);
        const session = await (0, auth_session_service_1.createAuthSession)(credentials.user.id, request);
        const accessToken = (0, auth_service_1.signAccessToken)(credentials.user, session.sessionId);
        (0, auth_session_service_1.setRefreshCookie)(response, session.refreshToken, session.expiresAt);
        return response.json({
            token: accessToken,
            accessToken,
            csrfToken: session.csrfToken,
            user: credentials.user,
            roles: credentials.roles,
            school_id: credentials.school_id,
        });
    }
    catch (error) {
        if (error instanceof abuse_protection_1.RateLimitError) {
            (0, request_context_middleware_1.securityLog)(request, 'login_rate_limited', 'denied', { ip, email: (0, abuse_protection_1.maskContact)(identifier) });
            response.setHeader('Retry-After', error.retryAfterSeconds);
            return response.status(429).json({ message: 'Too many requests. Please try again later.' });
        }
        (0, request_context_middleware_1.securityLog)(request, 'login_error', 'error', { error_type: error instanceof Error ? error.name : 'UnknownError' });
        return response.status(500).json({ message: PUBLIC_LOGIN_ERROR });
    }
}
const csrfHeader = () => process.env.CSRF_HEADER_NAME || 'X-CSRF-Token';
const sessionFailure = (response) => response.status(401).json({ message: 'Authentication required' });
async function csrf(request, response) {
    if (!(0, auth_session_service_1.requestOriginAllowed)(request))
        return sessionFailure(response);
    const refresh = (0, auth_session_service_1.readRefreshCookie)(request);
    if (!refresh)
        return sessionFailure(response);
    try {
        const result = await (0, auth_session_service_1.issueCsrfToken)(refresh);
        return response.json({ csrfToken: result.csrfToken });
    }
    catch {
        return sessionFailure(response);
    }
}
async function refresh(request, response) {
    if (!(0, auth_session_service_1.requestOriginAllowed)(request))
        return sessionFailure(response);
    const refreshToken = (0, auth_session_service_1.readRefreshCookie)(request);
    const csrfToken = request.header(csrfHeader());
    if (!refreshToken || !csrfToken)
        return sessionFailure(response);
    try {
        const rotated = await (0, auth_session_service_1.rotateRefreshToken)(refreshToken, csrfToken);
        const user = await (0, auth_service_1.findAuthUserById)(rotated.userId);
        if (!user) {
            await (0, auth_session_service_1.revokeSession)(rotated.sessionId);
            return sessionFailure(response);
        }
        const accessToken = (0, auth_service_1.signAccessToken)(user, rotated.sessionId);
        (0, auth_session_service_1.setRefreshCookie)(response, rotated.refreshToken, rotated.expiresAt);
        return response.json({ token: accessToken, accessToken, csrfToken: rotated.csrfToken });
    }
    catch (error) {
        (0, request_context_middleware_1.securityLog)(request, error instanceof auth_session_service_1.SessionReuseError ? 'refresh_token_reuse' : 'refresh_failed', 'denied');
        return sessionFailure(response);
    }
}
async function logout(request, response) {
    if (!(0, auth_session_service_1.requestOriginAllowed)(request))
        return sessionFailure(response);
    const refreshToken = (0, auth_session_service_1.readRefreshCookie)(request);
    const csrfToken = request.header(csrfHeader());
    if (!refreshToken || !csrfToken)
        return sessionFailure(response);
    try {
        const current = await (0, auth_session_service_1.rotateRefreshToken)(refreshToken, csrfToken);
        await (0, auth_session_service_1.revokeSession)(current.sessionId);
        (0, request_context_middleware_1.securityLog)(request, 'session_revoked', 'success');
        (0, auth_session_service_1.clearRefreshCookie)(response);
        return response.status(204).send();
    }
    catch {
        (0, auth_session_service_1.clearRefreshCookie)(response);
        return sessionFailure(response);
    }
}
async function logoutAll(request, response) {
    if (!request.user || !(0, auth_session_service_1.requestOriginAllowed)(request))
        return sessionFailure(response);
    const refreshToken = (0, auth_session_service_1.readRefreshCookie)(request);
    const csrfToken = request.header(csrfHeader());
    if (!refreshToken || !csrfToken)
        return sessionFailure(response);
    try {
        const current = await (0, auth_session_service_1.rotateRefreshToken)(refreshToken, csrfToken);
        if (current.userId !== request.user.id)
            return sessionFailure(response);
        await (0, auth_session_service_1.revokeAllUserSessions)(request.user.id);
        (0, request_context_middleware_1.securityLog)(request, 'all_sessions_revoked', 'success', { user_id: request.user.id });
        (0, auth_session_service_1.clearRefreshCookie)(response);
        return response.status(204).send();
    }
    catch {
        return sessionFailure(response);
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
