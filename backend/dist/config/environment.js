"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRuntimeEnvironment = validateRuntimeEnvironment;
const token_security_1 = require("./token-security");
function validateRuntimeEnvironment(environment = process.env.NODE_ENV) {
    (0, token_security_1.validateTokenConfiguration)();
    if (environment !== 'production')
        return;
    for (const name of ['DATABASE_URL', 'FRONTEND_URLS']) {
        if (!process.env[name]?.trim())
            throw new Error(`${name} is required in production`);
    }
    if (process.env.JWT_SECRET)
        throw new Error('JWT_SECRET fallback is forbidden in production');
}
