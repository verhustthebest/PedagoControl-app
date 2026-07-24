"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listManagementSubscriptions = listManagementSubscriptions;
const client_1 = __importDefault(require("../prisma/client"));
const inThirtyDays = () => new Date(Date.now() + 30 * 86400000);
function statusWhere(status, now) {
    if (status === 'expiring_soon')
        return { status: 'active', end_date: { gte: now, lte: inThirtyDays() } };
    if (status === 'expired')
        return { end_date: { lt: now } };
    if (status === 'overdue')
        return { status: 'overdue' };
    if (status === 'suspended')
        return { status: 'suspended' };
    if (status === 'active')
        return { status: 'active', end_date: { gt: inThirtyDays() } };
    return {};
}
/** Souscriptions Management réelles, avec projection publique et agrégats calculés sur la base. */
async function listManagementSubscriptions(input) {
    const now = new Date();
    const where = {
        ...statusWhere(input.status, now),
        ...(input.plan ? { subscriptions: { code: input.plan } } : {}),
        ...(input.billing_period ? { billing_period: input.billing_period } : {}),
        ...(input.search ? { schools: { OR: [
                    { name: { contains: input.search, mode: 'insensitive' } },
                    { code: { contains: input.search, mode: 'insensitive' } },
                    { promoter_name: { contains: input.search, mode: 'insensitive' } },
                ] } } : {}),
    };
    const [items, total, all] = await client_1.default.$transaction([
        client_1.default.school_subscriptions.findMany({ where, skip: (input.page - 1) * input.limit, take: input.limit, orderBy: { created_at: 'desc' }, select: {
                teacher_limit: true, billing_period: true, amount_to_pay: true, start_date: true, end_date: true, status: true,
                schools: { select: { public_id: true, code: true, name: true, promoter_name: true } },
                subscriptions: { select: { code: true, name: true } },
            } }),
        client_1.default.school_subscriptions.count({ where }),
        client_1.default.school_subscriptions.findMany({ select: { teacher_limit: true, end_date: true, status: true } }),
    ]);
    const expiring = all.filter(item => item.status === 'active' && item.end_date >= now && item.end_date <= inThirtyDays()).length;
    return {
        items: items.map(item => ({
            school: item.schools, plan: item.subscriptions, billing_period: item.billing_period,
            teacher_limit: item.teacher_limit, amount_to_pay: item.amount_to_pay.toString(),
            start_date: item.start_date, end_date: item.end_date, status: item.status,
        })),
        pagination: { page: input.page, limit: input.limit, total, total_pages: Math.ceil(total / input.limit) },
        summary: {
            total: all.length,
            active: all.filter(item => item.status === 'active' && item.end_date > inThirtyDays()).length,
            expiring_soon: expiring,
            overdue: all.filter(item => item.status === 'overdue' || item.end_date < now).length,
            teacher_quota: all.reduce((sum, item) => sum + item.teacher_limit, 0),
        },
    };
}
