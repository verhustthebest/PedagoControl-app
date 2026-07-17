"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_middleware_2 = require("../middleware/auth.middleware");
const access_policy_1 = require("../security/access-policy");
const validate_middleware_1 = require("../middleware/validate.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
function requireBroadcastAccess(request, response, next) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    if (!(0, access_policy_1.canBroadcast)(request.user))
        return response.status(403).json({ message: 'Access forbidden' });
    return next();
}
router.get('/notifications', auth_middleware_1.authenticateBearerToken, notification_controller_1.notifications);
router.get('/notifications/unread-count', auth_middleware_1.authenticateBearerToken, notification_controller_1.unreadNotificationCount);
router.patch('/notifications/read-all', auth_middleware_1.authenticateBearerToken, notification_controller_1.readAllNotifications);
router.patch('/notifications/:id/read', auth_middleware_1.authenticateBearerToken, (0, validate_middleware_1.validate)({ params: schemas_1.itemParams }), notification_controller_1.readNotification);
router.get('/messages', auth_middleware_1.authenticateBearerToken, notification_controller_1.messages);
router.post('/messages/broadcast', auth_middleware_1.authenticateBearerToken, (0, auth_middleware_2.requireSchoolContext)(), requireBroadcastAccess, (0, validate_middleware_1.validate)({ body: schemas_1.messageBody }), notification_controller_1.broadcastMessages);
router.patch('/messages/:id/read', auth_middleware_1.authenticateBearerToken, (0, validate_middleware_1.validate)({ params: schemas_1.itemParams }), notification_controller_1.readMessage);
exports.default = router;
