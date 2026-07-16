"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.getUserMessages = getUserMessages;
exports.broadcastMessage = broadcastMessage;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const client_1 = __importDefault(require("../prisma/client"));
const access_policy_1 = require("../security/access-policy");
function toBigInt(value) {
    return typeof value === 'bigint' ? value : BigInt(value);
}
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function reportContext(report) {
    const rawTeacher = [report.users?.first_name, report.users?.last_name].filter(Boolean).join(' ');
    const teacher = rawTeacher === 'Enseignant Demo' ? report.users?.email || 'Enseignant' : rawTeacher || report.users?.email || 'Enseignant';
    const schoolClass = report.teacher_assignments?.academic_year_subjects?.academic_year_classes?.school_classes;
    const className = [schoolClass?.name, schoolClass?.parallel].filter(Boolean).join(' ') || 'Classe';
    const subject = report.teacher_assignments?.academic_year_subjects?.subjects?.name || 'Matiere';
    const date = report.actual_date.toISOString().slice(0, 10);
    return `${teacher} - ${className} - ${subject} - ${date}`;
}
async function enrichLessonNotifications(notifications) {
    const lessonIds = notifications
        .filter((notification) => notification.reference_table === 'lesson_sessions' && notification.reference_id)
        .map((notification) => notification.reference_id);
    if (!lessonIds.length)
        return notifications;
    const reports = await client_1.default.lesson_sessions.findMany({
        where: { id: { in: lessonIds } },
        include: {
            users: { select: { first_name: true, last_name: true, email: true } },
            teacher_assignments: {
                include: {
                    academic_year_subjects: {
                        include: {
                            subjects: true,
                            academic_year_classes: { include: { school_classes: true } },
                        },
                    },
                },
            },
        },
    });
    const contextById = new Map(reports.map((report) => [report.id.toString(), reportContext(report)]));
    return notifications.map((notification) => {
        if (notification.reference_table !== 'lesson_sessions' || !notification.reference_id)
            return notification;
        const context = contextById.get(notification.reference_id.toString());
        if (!context)
            return notification;
        const decisionPrefix = notification.message.includes(' - ') ? notification.message.split(' - ')[0] : '';
        return { ...notification, message: decisionPrefix && ['validated', 'rejected', 'correction_requested'].includes(decisionPrefix) ? `${decisionPrefix} - ${context}` : context };
    });
}
async function getUserNotifications(user) {
    const notifications = await client_1.default.notifications.findMany({
        where: {
            recipient_user_id: toBigInt(user.id),
            notification_type: { not: 'message' },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
    });
    return serialize(await enrichLessonNotifications(notifications));
}
async function getUserMessages(user) {
    const messages = await client_1.default.notifications.findMany({
        where: {
            recipient_user_id: toBigInt(user.id),
            notification_type: 'message',
        },
        orderBy: { created_at: 'desc' },
        take: 20,
    });
    return serialize(messages);
}
async function broadcastMessage(user, input) {
    if (!input.message) {
        throw new Error('message is required');
    }
    if (!(0, access_policy_1.canBroadcast)(user))
        throw new Error('Access forbidden');
    if (!user.school_id && !(0, access_policy_1.isSuperAdmin)(user))
        throw new Error('Access forbidden');
    const recipients = await client_1.default.users.findMany({
        where: {
            is_active: true,
            ...(user.school_id ? { school_id: toBigInt(user.school_id) } : {}),
            ...(input.recipient === 'teachers' || input.recipient === 'all_teachers' ? {
                user_roles: {
                    some: {
                        roles: { name: 'ENSEIGNANT' },
                    },
                },
            } : {}),
            id: { not: toBigInt(user.id) },
        },
        select: { id: true },
    });
    if (!recipients.length)
        return [];
    await client_1.default.notifications.createMany({
        data: recipients.map((recipient) => ({
            recipient_user_id: recipient.id,
            sender_user_id: toBigInt(user.id),
            title: input.title || 'Nouveau message',
            message: input.message || '',
            notification_type: 'message',
            reference_table: 'notifications',
        })),
    });
    return getUserMessages(user);
}
async function getUnreadNotificationCount(user) {
    return client_1.default.notifications.count({
        where: {
            recipient_user_id: toBigInt(user.id),
            is_read: false,
            notification_type: { not: 'message' },
        },
    });
}
async function markNotificationRead(user, id) {
    const notification = await client_1.default.notifications.findFirst({
        where: {
            id: toBigInt(id),
            recipient_user_id: toBigInt(user.id),
        },
    });
    if (!notification) {
        throw new Error('Notification not found');
    }
    const updated = await client_1.default.notifications.update({
        where: { id: notification.id },
        data: {
            is_read: true,
            read_at: new Date(),
        },
    });
    return serialize(updated);
}
async function markAllNotificationsRead(user) {
    await client_1.default.notifications.updateMany({
        where: {
            recipient_user_id: toBigInt(user.id),
            is_read: false,
            notification_type: { not: 'message' },
        },
        data: {
            is_read: true,
            read_at: new Date(),
        },
    });
    return getUnreadNotificationCount(user);
}
