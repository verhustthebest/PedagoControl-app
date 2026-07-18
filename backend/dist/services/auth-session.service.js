"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCookieName = exports.SessionReuseError = exports.SessionError = void 0;
exports.setRefreshCookie = setRefreshCookie;
exports.clearRefreshCookie = clearRefreshCookie;
exports.readRefreshCookie = readRefreshCookie;
exports.parseRefreshToken = parseRefreshToken;
exports.requestOriginAllowed = requestOriginAllowed;
exports.createAuthSession = createAuthSession;
exports.issueCsrfToken = issueCsrfToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.assertActiveSession = assertActiveSession;
exports.revokeSession = revokeSession;
exports.revokeAllUserSessions = revokeAllUserSessions;
exports.revokeSessionsForSchool = revokeSessionsForSchool;
const crypto_1 = require("crypto");
const client_1 = __importDefault(require("../prisma/client"));
const token_security_1 = require("../config/token-security");
const http_1 = require("../config/http");
class SessionError extends Error {
}
exports.SessionError = SessionError;
class SessionReuseError extends SessionError {
}
exports.SessionReuseError = SessionReuseError;
const hash = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
const opaque = () => (0, crypto_1.randomBytes)(32).toString('base64url');
const ttlDays = () => {
    const value = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);
    return Number.isInteger(value) && value > 0 && value <= 365 ? value : 30;
};
const refreshCookieName = () => process.env.REFRESH_COOKIE_NAME || 'pedago_refresh';
exports.refreshCookieName = refreshCookieName;
function secureCookie() {
    return process.env.NODE_ENV === 'production' || process.env.REFRESH_COOKIE_SECURE === 'true';
}
function sameSite() {
    const configured = (process.env.REFRESH_COOKIE_SAME_SITE ?? (process.env.NODE_ENV === 'production' ? 'none' : 'lax')).toLowerCase();
    if (!['strict', 'lax', 'none'].includes(configured))
        return 'Lax';
    if (configured === 'none' && !secureCookie())
        return 'Lax';
    return configured[0].toUpperCase() + configured.slice(1);
}
function cookie(value, maxAge) {
    return `${(0, exports.refreshCookieName)()}=${value}; Path=/api/auth; HttpOnly; SameSite=${sameSite()}; Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}${secureCookie() ? '; Secure' : ''}`;
}
function setRefreshCookie(response, token, expiresAt) {
    response.setHeader('Set-Cookie', cookie(token, expiresAt.getTime() - Date.now()));
}
function clearRefreshCookie(response) {
    response.setHeader('Set-Cookie', cookie('', 0));
}
function readRefreshCookie(request) {
    const raw = request.header('cookie') ?? '';
    for (const entry of raw.split(';')) {
        const [name, ...parts] = entry.trim().split('=');
        if (name === (0, exports.refreshCookieName)())
            return parts.join('=') || null;
    }
    return null;
}
function parseRefreshToken(token) {
    const separator = token.indexOf('.');
    if (separator <= 0)
        throw new SessionError();
    const sessionId = token.slice(0, separator);
    const secret = token.slice(separator + 1);
    if (!/^[0-9a-f-]{36}$/i.test(sessionId) || secret.length < 40)
        throw new SessionError();
    return { sessionId, secret };
}
function safeHashMatch(value, expected) {
    const actual = Buffer.from(hash(value), 'hex');
    const stored = Buffer.from(expected, 'hex');
    return actual.length === stored.length && (0, crypto_1.timingSafeEqual)(actual, stored);
}
function metadata(request) {
    const ip = request.ip || request.socket.remoteAddress || '';
    const agent = request.header('user-agent') ?? '';
    return {
        ip_address_hash: ip ? (0, crypto_1.createHmac)('sha256', String((0, token_security_1.accessTokenSecret)())).update(ip).digest('hex') : null,
        user_agent_summary: agent ? hash(agent).slice(0, 64) : null,
    };
}
function requestOriginAllowed(request) {
    const raw = request.header('origin') || request.header('referer');
    if (!raw)
        return false;
    try {
        return (0, http_1.frontendOrigins)().has(new URL(raw).origin);
    }
    catch {
        return false;
    }
}
async function createAuthSession(userId, request) {
    const refreshSecret = opaque();
    const csrfToken = opaque();
    const expiresAt = new Date(Date.now() + ttlDays() * 86400000);
    const session = await client_1.default.auth_sessions.create({ data: {
            user_id: BigInt(userId), refresh_token_hash: hash(refreshSecret), csrf_token_hash: hash(csrfToken),
            expires_at: expiresAt, ...metadata(request),
        } });
    return { sessionId: session.id, refreshToken: `${session.id}.${refreshSecret}`, csrfToken, expiresAt };
}
async function activeSession(token) {
    const parsed = parseRefreshToken(token);
    const session = await client_1.default.auth_sessions.findUnique({ where: { id: parsed.sessionId } });
    if (!session || session.revoked_at || session.expires_at.getTime() <= Date.now())
        throw new SessionError();
    if (!safeHashMatch(parsed.secret, session.refresh_token_hash)) {
        await client_1.default.auth_sessions.updateMany({ where: { id: parsed.sessionId, revoked_at: null }, data: { revoked_at: new Date() } });
        throw new SessionReuseError();
    }
    return { session, parsed };
}
async function issueCsrfToken(refreshToken) {
    const { session } = await activeSession(refreshToken);
    const csrfToken = opaque();
    await client_1.default.auth_sessions.update({ where: { id: session.id }, data: { csrf_token_hash: hash(csrfToken), last_used_at: new Date() } });
    return { sessionId: session.id, userId: session.user_id.toString(), csrfToken };
}
async function rotateRefreshToken(refreshToken, csrfToken) {
    const { session, parsed } = await activeSession(refreshToken);
    if (!safeHashMatch(csrfToken, session.csrf_token_hash))
        throw new SessionError();
    const nextSecret = opaque();
    const nextCsrf = opaque();
    const updated = await client_1.default.$transaction(transaction => transaction.auth_sessions.updateMany({
        where: { id: session.id, refresh_token_hash: hash(parsed.secret), revoked_at: null, expires_at: { gt: new Date() } },
        data: { refresh_token_hash: hash(nextSecret), csrf_token_hash: hash(nextCsrf), last_used_at: new Date() },
    }));
    if (updated.count !== 1) {
        await revokeSession(session.id);
        throw new SessionError();
    }
    return { sessionId: session.id, userId: session.user_id.toString(), refreshToken: `${session.id}.${nextSecret}`, csrfToken: nextCsrf, expiresAt: session.expires_at };
}
async function assertActiveSession(sessionId, userId) {
    const session = await client_1.default.auth_sessions.findFirst({ where: { id: sessionId, user_id: BigInt(userId), revoked_at: null, expires_at: { gt: new Date() } }, select: { id: true } });
    return Boolean(session);
}
async function revokeSession(sessionId) {
    await client_1.default.auth_sessions.updateMany({ where: { id: sessionId, revoked_at: null }, data: { revoked_at: new Date() } });
}
async function revokeAllUserSessions(userId) {
    await client_1.default.auth_sessions.updateMany({ where: { user_id: BigInt(userId), revoked_at: null }, data: { revoked_at: new Date() } });
}
async function revokeSessionsForSchool(schoolId) {
    await client_1.default.auth_sessions.updateMany({ where: { users: { school_id: BigInt(schoolId) }, revoked_at: null }, data: { revoked_at: new Date() } });
}
