"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptions = subscriptions;
exports.saveDraft = saveDraft;
exports.createSchoolOnboarding = createSchoolOnboarding;
const school_onboarding_service_1 = require("../services/school-onboarding.service");
async function subscriptions(_request, response) {
    const items = await (0, school_onboarding_service_1.listSubscriptionCatalog)();
    return response.json({ items: items.map((item) => ({ ...item, monthly_price: item.monthly_price.toString(), annual_price: item.annual_price?.toString() ?? null })) });
}
async function saveDraft(request, response) {
    const draft = await (0, school_onboarding_service_1.saveSchoolDraft)(request.user.id, request.body);
    return draft ? response.status(request.body.draft_id ? 200 : 201).json({ draft }) : response.status(404).json({ message: 'Resource not found' });
}
async function createSchoolOnboarding(request, response) {
    try {
        const result = await (0, school_onboarding_service_1.finalizeSchool)(request.user.id, request.body);
        if (result.kind === 'not_found')
            return response.status(404).json({ message: 'Resource not found' });
        if (result.kind === 'conflict')
            return response.status(409).json({ message: 'Operation already in progress' });
        return response.status(result.repeated ? 200 : 201).json({
            school: { public_id: result.public_id },
            repeated: result.repeated,
            ...('notification_status' in result ? { notification_status: result.notification_status } : {}),
        });
    }
    catch {
        return response.status(400).json({ message: 'Unable to create school with the supplied configuration' });
    }
}
