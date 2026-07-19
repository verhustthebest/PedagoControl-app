"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTestConfig = notificationTestConfig;
exports.sendTest = sendTest;
const request_context_middleware_1 = require("../middleware/request-context.middleware");
const notification_test_service_1 = require("../services/notification-test.service");
const requestId = (request) => request.requestId;
function notificationTestConfig(request, response) { (0, request_context_middleware_1.securityLog)(request, 'notification_test_config', 'success'); return response.json({ ...(0, notification_test_service_1.notificationTestConfiguration)(), request_id: requestId(request) }); }
async function sendTest(request, response) { try {
    const result = await (0, notification_test_service_1.sendNotificationTest)(request.body);
    (0, request_context_middleware_1.securityLog)(request, 'notification_test_send', result.status === 'FAILED' ? 'error' : 'success', { channel: result.channel, provider: result.provider, status: result.status, destination: request.body.destination });
    return response.status(201).json({ ...result, request_id: requestId(request) });
}
catch (error) {
    (0, request_context_middleware_1.securityLog)(request, 'notification_test_send', 'error', { error_type: error instanceof Error ? error.name : 'UnknownError' });
    return response.status(502).json({ message: 'Notification test failed' });
} }
