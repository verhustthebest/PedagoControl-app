"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTrustProxyHops = resolveTrustProxyHops;
function resolveTrustProxyHops(environment = process.env.NODE_ENV, configured = process.env.TRUST_PROXY_HOPS) {
    if (configured !== undefined && configured !== '') {
        const hops = Number(configured);
        if (!Number.isInteger(hops) || hops < 0 || hops > 5) {
            throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 5');
        }
        return hops;
    }
    return environment === 'production' ? 1 : 0;
}
