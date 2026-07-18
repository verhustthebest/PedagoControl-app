"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifications = notifications;
exports.unreadNotificationCount = unreadNotificationCount;
exports.readNotification = readNotification;
exports.readAllNotifications = readAllNotifications;
exports.messages = messages;
exports.broadcastMessages = broadcastMessages;
exports.readMessage = readMessage;
const notification_service_1 = require("../services/notification.service");
function requireUser(request, response) {
    if (!request.user) {
        response.status(401).json({ message: 'Authentication required' });
        return null;
    }
    return request.user;
}
async function notifications(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const items = await (0, notification_service_1.getUserNotifications)(user);
        return response.json({ notifications: items });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch notifications' });
    }
}
async function unreadNotificationCount(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const count = await (0, notification_service_1.getUnreadNotificationCount)(user);
        return response.json({ count });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch unread notification count' });
    }
}
async function readNotification(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const item = await (0, notification_service_1.markNotificationRead)(user, String(request.params.id));
        return response.json({ notification: item });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to mark notification read';
        return response.status(message.includes('not found') ? 404 : 500).json({ message });
    }
}
async function readAllNotifications(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const count = await (0, notification_service_1.markAllNotificationsRead)(user);
        return response.json({ count });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to mark all notifications read' });
    }
}
async function messages(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const items = await (0, notification_service_1.getUserMessages)(user);
        return response.json({ messages: items });
    }
    catch (error) {
        return response.status(500).json({ message: 'Unable to fetch messages' });
    }
}
async function broadcastMessages(request, response) {
    const user = requireUser(request, response);
    if (!user)
        return;
    try {
        const items = await (0, notification_service_1.broadcastMessage)(user, request.body);
        return response.status(201).json({ messages: items });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to broadcast message';
        return response.status(message.includes('required') ? 400 : 500).json({ message });
    }
}
async function readMessage(request, response) {
    return readNotification(request, response);
}
