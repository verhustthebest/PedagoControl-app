"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
const auth_service_1 = require("../services/auth.service");
async function login(request, response) {
    const { email, password } = request.body;
    if (!email || !password) {
        return response.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const session = await (0, auth_service_1.loginWithEmailAndPassword)(email, password);
        if (!session) {
            return response.status(401).json({ message: 'Invalid email or password' });
        }
        return response.json(session);
    }
    catch (error) {
        console.error('Unable to login', error);
        return response.status(500).json({ message: 'Unable to login' });
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
