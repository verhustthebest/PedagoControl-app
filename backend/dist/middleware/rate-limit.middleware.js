"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalApiRateLimit = globalApiRateLimit;
const abuse_protection_1 = require("../security/abuse-protection");
function positiveInteger(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}
const globalLimiter = new abuse_protection_1.SlidingWindowLimiter(positiveInteger('API_RATE_LIMIT_MAX', 300), positiveInteger('API_RATE_LIMIT_WINDOW_MINUTES', 15) * 60000);
function globalApiRateLimit(request, response, next) {
    const result = globalLimiter.consume(`global:${request.ip}`);
    if (result.allowed)
        return next();
    response.setHeader('Retry-After', result.retryAfterSeconds);
    return response.status(429).json({ message: 'Too many requests. Please try again later.' });
}
