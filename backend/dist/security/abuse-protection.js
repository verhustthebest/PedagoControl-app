"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpAbuseGuard = exports.loginAbuseGuard = exports.OtpAbuseGuard = exports.LoginAbuseGuard = exports.SlidingWindowLimiter = exports.RateLimitError = void 0;
exports.normalizeIdentifier = normalizeIdentifier;
exports.maskContact = maskContact;
exports.opaqueNumericId = opaqueNumericId;
exports.publicOtpRequestResponse = publicOtpRequestResponse;
exports.fingerprint = fingerprint;
exports.wait = wait;
const crypto_1 = require("crypto");
class RateLimitError extends Error {
    constructor(retryAfterSeconds) {
        super('Too many requests');
        this.retryAfterSeconds = retryAfterSeconds;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class SlidingWindowLimiter {
    constructor(maximum, windowMs, now = Date.now) {
        this.maximum = maximum;
        this.windowMs = windowMs;
        this.now = now;
        this.entries = new Map();
    }
    consume(key) {
        const now = this.now();
        const entry = this.entries.get(key) ?? { timestamps: [], failures: 0 };
        entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > now - this.windowMs);
        if (entry.timestamps.length >= this.maximum) {
            const retryAfterMs = Math.max(1, entry.timestamps[0] + this.windowMs - now);
            this.entries.set(key, entry);
            return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
        }
        entry.timestamps.push(now);
        this.entries.set(key, entry);
        return { allowed: true, retryAfterSeconds: 0 };
    }
    failures(key) {
        return this.entries.get(key)?.failures ?? 0;
    }
    recordFailure(key) {
        const entry = this.entries.get(key) ?? { timestamps: [], failures: 0 };
        entry.failures += 1;
        this.entries.set(key, entry);
        return entry.failures;
    }
    forgive(key, count = 1) {
        const entry = this.entries.get(key);
        if (!entry)
            return;
        entry.failures = Math.max(0, entry.failures - count);
        entry.timestamps.splice(0, Math.min(count, entry.timestamps.length));
        if (!entry.failures && !entry.timestamps.length)
            this.entries.delete(key);
    }
    reset() {
        this.entries.clear();
    }
}
exports.SlidingWindowLimiter = SlidingWindowLimiter;
function positiveInteger(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}
function normalizeIdentifier(value) {
    if (typeof value !== 'string')
        return 'missing';
    const normalized = value.trim().toLowerCase();
    if (!normalized)
        return 'missing';
    if (normalized.includes('@'))
        return normalized;
    return normalized.replace(/[\s().-]/g, '').replace(/^00/, '+');
}
function maskContact(value) {
    const normalized = normalizeIdentifier(value);
    if (normalized.includes('@')) {
        const [local, domain] = normalized.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
    }
    return normalized.length <= 4 ? '***' : `${normalized.slice(0, 3)}***${normalized.slice(-2)}`;
}
function opaqueNumericId() {
    return `${Date.now()}${(0, crypto_1.randomInt)(100000, 999999)}`;
}
function publicOtpRequestResponse(verificationId, expiresInSeconds = 600) {
    return {
        message: 'If the information is eligible, a verification code will be sent.',
        verification_id: verificationId ?? opaqueNumericId(),
        expires_in_seconds: expiresInSeconds,
    };
}
function fingerprint(value) {
    return (0, crypto_1.createHash)('sha256').update(typeof value === 'string' ? value : 'missing').digest('hex').slice(0, 24);
}
class LoginAbuseGuard {
    constructor(options = {}) {
        const windowMs = options.windowMs ?? positiveInteger('LOGIN_RATE_WINDOW_MINUTES', 15) * 60000;
        this.ipLimiter = new SlidingWindowLimiter(options.ipMax ?? positiveInteger('LOGIN_RATE_IP_MAX', 20), windowMs, options.now);
        this.identifierLimiter = new SlidingWindowLimiter(options.identifierMax ?? positiveInteger('LOGIN_RATE_IDENTIFIER_MAX', 8), windowMs, options.now);
        this.delayThreshold = options.delayThreshold ?? positiveInteger('LOGIN_DELAY_THRESHOLD', 3);
        this.delayBaseMs = options.delayBaseMs ?? positiveInteger('LOGIN_DELAY_BASE_MS', 250);
        this.delayMaxMs = options.delayMaxMs ?? positiveInteger('LOGIN_DELAY_MAX_MS', 4000);
    }
    begin(ip, identifier) {
        const ipResult = this.ipLimiter.consume(`ip:${ip}`);
        const identifierResult = this.identifierLimiter.consume(`id:${identifier}`);
        if (!ipResult.allowed || !identifierResult.allowed) {
            throw new RateLimitError(Math.max(ipResult.retryAfterSeconds, identifierResult.retryAfterSeconds));
        }
    }
    failed(ip, identifier) {
        this.ipLimiter.recordFailure(`ip:${ip}`);
        const failures = this.identifierLimiter.recordFailure(`id:${identifier}`);
        if (failures < this.delayThreshold)
            return 0;
        return Math.min(this.delayMaxMs, this.delayBaseMs * 2 ** (failures - this.delayThreshold));
    }
    succeeded(ip, identifier) {
        this.ipLimiter.forgive(`ip:${ip}`, 1);
        this.identifierLimiter.forgive(`id:${identifier}`, 2);
    }
}
exports.LoginAbuseGuard = LoginAbuseGuard;
class OtpAbuseGuard {
    constructor(options = {}) {
        this.hour = new SlidingWindowLimiter(options.hourMax ?? positiveInteger('OTP_REQUEST_MAX_PER_HOUR', 4), 60 * 60000, options.now);
        this.day = new SlidingWindowLimiter(options.dayMax ?? positiveInteger('OTP_REQUEST_MAX_PER_DAY', 10), 24 * 60 * 60000, options.now);
        this.verify = new SlidingWindowLimiter(options.verifyMax ?? positiveInteger('OTP_VERIFY_MAX_ATTEMPTS', 5), positiveInteger('OTP_VERIFY_WINDOW_MINUTES', 15) * 60000, options.now);
        this.registration = new SlidingWindowLimiter(positiveInteger('PARENT_REGISTRATION_MAX_PER_HOUR', 5), 60 * 60000, options.now);
    }
    request(keys) {
        let retryAfter = 0;
        for (const key of keys) {
            const hourly = this.hour.consume(key);
            const daily = this.day.consume(key);
            if (!hourly.allowed || !daily.allowed)
                retryAfter = Math.max(retryAfter, hourly.retryAfterSeconds, daily.retryAfterSeconds);
        }
        if (retryAfter)
            throw new RateLimitError(retryAfter);
    }
    verification(keys) {
        let retryAfter = 0;
        for (const key of keys) {
            const result = this.verify.consume(key);
            if (!result.allowed)
                retryAfter = Math.max(retryAfter, result.retryAfterSeconds);
        }
        if (retryAfter)
            throw new RateLimitError(retryAfter);
    }
    registrationAttempt(keys) {
        let retryAfter = 0;
        for (const key of keys) {
            const result = this.registration.consume(key);
            if (!result.allowed)
                retryAfter = Math.max(retryAfter, result.retryAfterSeconds);
        }
        if (retryAfter)
            throw new RateLimitError(retryAfter);
    }
}
exports.OtpAbuseGuard = OtpAbuseGuard;
exports.loginAbuseGuard = new LoginAbuseGuard();
exports.otpAbuseGuard = new OtpAbuseGuard();
function wait(milliseconds) {
    return milliseconds > 0 ? new Promise((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve();
}
