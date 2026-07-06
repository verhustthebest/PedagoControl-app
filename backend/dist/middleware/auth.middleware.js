"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateBearerToken = authenticateBearerToken;
const auth_service_1 = require("../services/auth.service");
async function authenticateBearerToken(request, response, next) {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Bearer token required' });
    }
    const token = authorization.slice('Bearer '.length).trim();
    try {
        const payload = (0, auth_service_1.verifyAuthToken)(token);
        const user = await (0, auth_service_1.findAuthUserById)(payload.sub);
        if (!user) {
            return response.status(401).json({ message: 'Invalid token user' });
        }
        request.user = user;
        return next();
    }
    catch {
        return response.status(401).json({ message: 'Invalid or expired token' });
    }
}
