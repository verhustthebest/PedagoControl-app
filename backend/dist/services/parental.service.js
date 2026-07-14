"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentalApiError = void 0;
exports.getParentalSettings = getParentalSettings;
exports.updateParentalSettings = updateParentalSettings;
exports.getParentalSubscription = getParentalSubscription;
exports.updateParentalSubscription = updateParentalSubscription;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
class ParentalApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ParentalApiError';
    }
}
exports.ParentalApiError = ParentalApiError;
function parseSchoolId(value) {
    try {
        const schoolId = BigInt(value);
        if (schoolId <= 0n)
            throw new Error();
        return schoolId;
    }
    catch {
        throw new ParentalApiError('A valid school id is required', 400);
    }
}
function parsePositiveInteger(value, field) {
    if (!Number.isInteger(value) || Number(value) <= 0) {
        throw new ParentalApiError(`${field} must be a positive integer`, 400);
    }
    return Number(value);
}
function parseOptionalTime(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);
    if (!match) {
        throw new ParentalApiError('daily_acknowledgement_deadline must use HH:mm or HH:mm:ss', 400);
    }
    const [, hours, minutes, seconds = '00'] = match;
    return new Date(Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds)));
}
function parsePositiveAmount(value) {
    if (value === undefined || value === null || value === '') {
        throw new ParentalApiError('unit_price_per_student is required', 400);
    }
    try {
        const amount = new client_1.Prisma.Decimal(value);
        if (!amount.isPositive())
            throw new Error();
        return amount;
    }
    catch {
        throw new ParentalApiError('unit_price_per_student must be a positive amount', 400);
    }
}
async function ensureSchoolExists(schoolId) {
    const school = await client_2.default.schools.findUnique({
        where: { id: schoolId },
        select: { id: true },
    });
    if (!school) {
        throw new ParentalApiError('School not found', 404);
    }
}
function utcDateOnly(value = new Date()) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
function lastDayOfMonthUtc(value) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));
}
async function getParentalSettings(schoolIdValue) {
    const schoolId = parseSchoolId(schoolIdValue);
    await ensureSchoolExists(schoolId);
    return client_2.default.school_parental_settings.findUnique({
        where: { school_id: schoolId },
    });
}
async function updateParentalSettings(schoolIdValue, actorUserId, input) {
    const schoolId = parseSchoolId(schoolIdValue);
    const actorId = BigInt(actorUserId);
    await ensureSchoolExists(schoolId);
    const existing = await client_2.default.school_parental_settings.findUnique({
        where: { school_id: schoolId },
    });
    const integerFields = {
        attachment_request_expiry_days: input.attachment_request_expiry_days,
        otp_expiry_minutes: input.otp_expiry_minutes,
        otp_max_attempts: input.otp_max_attempts,
    };
    for (const [field, value] of Object.entries(integerFields)) {
        if (value !== undefined)
            parsePositiveInteger(value, field);
    }
    const deadline = parseOptionalTime(input.daily_acknowledgement_deadline);
    const enabledChanged = input.is_enabled !== undefined && input.is_enabled !== (existing?.is_enabled ?? false);
    const now = new Date();
    return client_2.default.$transaction(async (transaction) => {
        const settings = await transaction.school_parental_settings.upsert({
            where: { school_id: schoolId },
            update: {
                ...(input.is_enabled !== undefined ? { is_enabled: input.is_enabled } : {}),
                ...(input.is_enabled === true && enabledChanged ? { enabled_at: now, disabled_at: null } : {}),
                ...(input.is_enabled === false && enabledChanged ? { disabled_at: now } : {}),
                ...(input.attachment_requires_validation !== undefined
                    ? { attachment_requires_validation: input.attachment_requires_validation }
                    : {}),
                ...(input.attachment_request_expiry_days !== undefined
                    ? { attachment_request_expiry_days: input.attachment_request_expiry_days }
                    : {}),
                ...(input.otp_expiry_minutes !== undefined ? { otp_expiry_minutes: input.otp_expiry_minutes } : {}),
                ...(input.otp_max_attempts !== undefined ? { otp_max_attempts: input.otp_max_attempts } : {}),
                ...(input.daily_acknowledgement_required !== undefined
                    ? { daily_acknowledgement_required: input.daily_acknowledgement_required }
                    : {}),
                ...(deadline !== undefined ? { daily_acknowledgement_deadline: deadline } : {}),
                updated_by_user_id: actorId,
                updated_at: now,
            },
            create: {
                school_id: schoolId,
                is_enabled: input.is_enabled ?? false,
                enabled_at: input.is_enabled ? now : null,
                attachment_requires_validation: input.attachment_requires_validation ?? true,
                attachment_request_expiry_days: input.attachment_request_expiry_days ?? 7,
                otp_expiry_minutes: input.otp_expiry_minutes ?? 10,
                otp_max_attempts: input.otp_max_attempts ?? 5,
                daily_acknowledgement_required: input.daily_acknowledgement_required ?? true,
                daily_acknowledgement_deadline: deadline ?? null,
                created_by_user_id: actorId,
                updated_by_user_id: actorId,
            },
        });
        if (enabledChanged) {
            const enabled = input.is_enabled === true;
            await transaction.activity_logs.create({
                data: {
                    school_id: schoolId,
                    user_id: actorId,
                    activity_type: enabled ? 'parental_module_activated' : 'parental_module_disabled',
                    module_name: 'parental_tracking',
                    reference_table: 'school_parental_settings',
                    reference_id: settings.id,
                    title: enabled ? 'Activation du Suivi parental' : 'Desactivation du Suivi parental',
                    description: enabled
                        ? 'Le module Suivi parental a ete active pour l ecole.'
                        : 'Le module Suivi parental a ete desactive pour l ecole.',
                },
            });
        }
        return settings;
    });
}
async function getParentalSubscription(schoolIdValue) {
    const schoolId = parseSchoolId(schoolIdValue);
    await ensureSchoolExists(schoolId);
    return client_2.default.school_parental_subscriptions.findFirst({
        where: {
            school_id: schoolId,
            status: 'active',
        },
        include: {
            school_subscriptions: true,
        },
        orderBy: { created_at: 'desc' },
    });
}
async function updateParentalSubscription(schoolIdValue, actorUserId, input) {
    const schoolId = parseSchoolId(schoolIdValue);
    const actorId = BigInt(actorUserId);
    const unitPrice = parsePositiveAmount(input.unit_price_per_student);
    const startDate = utcDateOnly();
    await ensureSchoolExists(schoolId);
    let requestedMainSubscriptionId;
    if (input.school_subscription_id) {
        try {
            requestedMainSubscriptionId = BigInt(input.school_subscription_id);
            if (requestedMainSubscriptionId <= 0n)
                throw new Error();
        }
        catch {
            throw new ParentalApiError('A valid school_subscription_id is required', 400);
        }
    }
    const mainSubscription = await client_2.default.school_subscriptions.findFirst({
        where: {
            school_id: schoolId,
            status: 'active',
            start_date: { lte: startDate },
            end_date: { gte: startDate },
            ...(requestedMainSubscriptionId ? { id: requestedMainSubscriptionId } : {}),
        },
        orderBy: { created_at: 'desc' },
    });
    if (!mainSubscription) {
        throw new ParentalApiError('No active main school subscription is valid for the parental subscription start date', 422);
    }
    const existing = await client_2.default.school_parental_subscriptions.findUnique({
        where: {
            school_id_school_subscription_id: {
                school_id: schoolId,
                school_subscription_id: mainSubscription.id,
            },
        },
    });
    const priceChanged = !existing || !existing.unit_price_per_student.equals(unitPrice);
    const now = new Date();
    return client_2.default.$transaction(async (transaction) => {
        const subscription = await transaction.school_parental_subscriptions.upsert({
            where: {
                school_id_school_subscription_id: {
                    school_id: schoolId,
                    school_subscription_id: mainSubscription.id,
                },
            },
            update: {
                unit_price_per_student: unitPrice,
                currency: 'USD',
                billing_period: 'monthly',
                status: 'active',
                next_invoice_date: lastDayOfMonthUtc(startDate),
                updated_at: now,
            },
            create: {
                school_id: schoolId,
                school_subscription_id: mainSubscription.id,
                unit_price_per_student: unitPrice,
                currency: 'USD',
                billing_period: 'monthly',
                start_date: startDate,
                end_date: mainSubscription.end_date,
                next_invoice_date: lastDayOfMonthUtc(startDate),
                status: 'active',
            },
        });
        if (priceChanged) {
            await transaction.activity_logs.create({
                data: {
                    school_id: schoolId,
                    user_id: actorId,
                    activity_type: 'parental_price_changed',
                    module_name: 'parental_tracking',
                    reference_table: 'school_parental_subscriptions',
                    reference_id: subscription.id,
                    title: 'Modification du prix du Suivi parental',
                    description: `Prix par eleve configure a ${unitPrice.toFixed(2)} USD. Les factures deja emises restent inchangees.`,
                },
            });
        }
        return subscription;
    });
}
