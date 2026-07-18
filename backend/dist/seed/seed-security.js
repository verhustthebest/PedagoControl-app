"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSeedAllowed = assertSeedAllowed;
exports.seedPassword = seedPassword;
function assertSeedAllowed(kind, environment = process.env.NODE_ENV) {
    if (environment === 'production')
        throw new Error(`${kind} seed is disabled in production`);
}
function seedPassword(name) {
    const value = process.env[name];
    if (!value || value.length < 12 || !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
        throw new Error(`${name} must be configured with a strong development-only password`);
    }
    return value;
}
