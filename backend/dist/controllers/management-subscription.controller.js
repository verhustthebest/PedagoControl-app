"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managementSubscriptions = managementSubscriptions;
const management_subscription_service_1 = require("../services/management-subscription.service");
async function managementSubscriptions(request, response) {
    const result = await (0, management_subscription_service_1.listManagementSubscriptions)({
        page: Number(request.query.page || 1), limit: Number(request.query.limit || 20),
        search: request.query.search, status: request.query.status,
        plan: request.query.plan, billing_period: request.query.billing_period,
    });
    return response.json(result);
}
