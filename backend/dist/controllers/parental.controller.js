"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showParentalSettings = showParentalSettings;
exports.saveParentalSettings = saveParentalSettings;
exports.showParentalSubscription = showParentalSubscription;
exports.saveParentalSubscription = saveParentalSubscription;
const parental_service_1 = require("../services/parental.service");
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function serializeSettings(settings) {
    if (!settings)
        return settings;
    const serialized = serialize(settings);
    const deadline = settings.daily_acknowledgement_deadline;
    serialized.daily_acknowledgement_deadline = deadline
        ? [deadline.getUTCHours(), deadline.getUTCMinutes(), deadline.getUTCSeconds()]
            .map((part) => part.toString().padStart(2, '0'))
            .join(':')
        : null;
    return serialized;
}
function schoolIdFrom(request) {
    const value = request.params.schoolId;
    return Array.isArray(value) ? value[0] : value;
}
function handleError(response, error, fallbackMessage) {
    if (error instanceof parental_service_1.ParentalApiError) {
        return response.status(error.statusCode).json({ message: error.message });
    }
    return response.status(500).json({ message: fallbackMessage });
}
async function showParentalSettings(request, response) {
    try {
        const settings = await (0, parental_service_1.getParentalSettings)(schoolIdFrom(request));
        return response.json({ settings: serializeSettings(settings) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch parental settings');
    }
}
async function saveParentalSettings(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const settings = await (0, parental_service_1.updateParentalSettings)(schoolIdFrom(request), request.user.id, request.body);
        return response.json({ settings: serializeSettings(settings) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update parental settings');
    }
}
async function showParentalSubscription(request, response) {
    try {
        const subscription = await (0, parental_service_1.getParentalSubscription)(schoolIdFrom(request));
        return response.json({ subscription: serialize(subscription) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to fetch parental subscription');
    }
}
async function saveParentalSubscription(request, response) {
    if (!request.user)
        return response.status(401).json({ message: 'Authentication required' });
    try {
        const subscription = await (0, parental_service_1.updateParentalSubscription)(schoolIdFrom(request), request.user.id, request.body);
        return response.json({ subscription: serialize(subscription) });
    }
    catch (error) {
        return handleError(response, error, 'Unable to update parental subscription');
    }
}
