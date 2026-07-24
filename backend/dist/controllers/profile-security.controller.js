"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = changePassword;
exports.profilePhoto = profilePhoto;
const profile_security_service_1 = require("../services/profile-security.service");
const request_context_middleware_1 = require("../middleware/request-context.middleware");
const fail = (res, e) => e instanceof profile_security_service_1.ProfileSecurityError ? res.status(e.status).json({ message: e.message }) : res.status(500).json({ message: 'Opération impossible.' });
async function changePassword(req, res) { try {
    await (0, profile_security_service_1.changeUserPassword)(req.user.id, req.body.current_password, req.body.new_password);
    (0, request_context_middleware_1.securityLog)(req, 'password_changed', 'success');
    return res.status(204).end();
}
catch (e) {
    (0, request_context_middleware_1.securityLog)(req, 'password_change_refused', 'denied');
    return fail(res, e);
} }
async function profilePhoto(req, res) { try {
    const user = await (0, profile_security_service_1.replaceProfilePhoto)(req.user.id, req.body);
    (0, request_context_middleware_1.securityLog)(req, 'profile_photo_changed', 'success');
    return res.json({ user });
}
catch (e) {
    return fail(res, e);
} }
