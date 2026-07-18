"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionTokenError = exports.ACTIONS = void 0;
exports.issueActionToken = issueActionToken;
exports.consumeActionToken = consumeActionToken;
exports.revokeActionTokens = revokeActionTokens;
const crypto_1 = require("crypto");
const client_1 = __importDefault(require("../prisma/client"));
exports.ACTIONS = ['parent_activation', 'invitation', 'password_reset', 'contact_confirmation', 'invoice_download'];
class ActionTokenError extends Error {
}
exports.ActionTokenError = ActionTokenError;
const digest = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
function ttlMinutes(action) {
    const name = action === 'invoice_download' ? 'INVOICE_DOWNLOAD_TOKEN_TTL_MINUTES' : 'ACTION_TOKEN_TTL_MINUTES';
    const fallback = action === 'invoice_download' ? 5 : 15;
    const configured = Number(process.env[name] ?? fallback);
    return Number.isInteger(configured) && configured > 0 && configured <= 1440 ? configured : fallback;
}
function parse(raw) {
    const separator = raw.indexOf('.');
    const id = raw.slice(0, separator);
    const secret = raw.slice(separator + 1);
    if (separator < 0 || !/^[0-9a-f-]{36}$/i.test(id) || secret.length < 43)
        throw new ActionTokenError();
    return { id, secret };
}
function safeMatch(secret, expectedHash) {
    const actual = Buffer.from(digest(secret), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && (0, crypto_1.timingSafeEqual)(actual, expected);
}
async function issueActionToken(action, binding, minutes = ttlMinutes(action)) {
    const id = (0, crypto_1.randomUUID)();
    const secret = (0, crypto_1.randomBytes)(32).toString('base64url');
    const expiresAt = new Date(Date.now() + minutes * 60000);
    const where = {
        action,
        ...(binding.userId ? { user_id: BigInt(binding.userId) } : {}),
        ...(binding.guardianId ? { guardian_id: BigInt(binding.guardianId) } : {}),
        ...(binding.invoiceId ? { school_invoice_id: BigInt(binding.invoiceId) } : {}),
        ...(binding.resourcePublicId ? { resource_public_id: binding.resourcePublicId } : {}),
        used_at: null,
        revoked_at: null,
    };
    await client_1.default.$transaction(async (transaction) => {
        await transaction.action_tokens.updateMany({ where, data: { revoked_at: new Date() } });
        await transaction.action_tokens.create({ data: {
                id, token_hash: digest(secret), action,
                user_id: binding.userId ? BigInt(binding.userId) : null,
                guardian_id: binding.guardianId ? BigInt(binding.guardianId) : null,
                school_invoice_id: binding.invoiceId ? BigInt(binding.invoiceId) : null,
                resource_public_id: binding.resourcePublicId ?? null,
                expires_at: expiresAt,
            } });
    });
    return { token: `${id}.${secret}`, expiresAt };
}
async function consumeActionToken(raw, action, expected = {}) {
    const parsed = parse(raw);
    const record = await client_1.default.action_tokens.findUnique({ where: { id: parsed.id } });
    if (!record || record.action !== action || record.used_at || record.revoked_at || record.expires_at.getTime() <= Date.now())
        throw new ActionTokenError();
    if (!safeMatch(parsed.secret, record.token_hash))
        throw new ActionTokenError();
    if (expected.userId && record.user_id?.toString() !== expected.userId)
        throw new ActionTokenError();
    if (expected.guardianId && record.guardian_id?.toString() !== expected.guardianId)
        throw new ActionTokenError();
    if (expected.invoiceId && record.school_invoice_id?.toString() !== expected.invoiceId)
        throw new ActionTokenError();
    if (expected.resourcePublicId && record.resource_public_id !== expected.resourcePublicId)
        throw new ActionTokenError();
    const used = await client_1.default.action_tokens.updateMany({ where: { id: record.id, used_at: null, revoked_at: null, expires_at: { gt: new Date() } }, data: { used_at: new Date() } });
    if (used.count !== 1)
        throw new ActionTokenError();
    return record;
}
async function revokeActionTokens(action, binding) {
    await client_1.default.action_tokens.updateMany({ where: {
            action,
            ...(binding.userId ? { user_id: BigInt(binding.userId) } : {}),
            ...(binding.guardianId ? { guardian_id: BigInt(binding.guardianId) } : {}),
            ...(binding.invoiceId ? { school_invoice_id: BigInt(binding.invoiceId) } : {}),
            revoked_at: null,
        }, data: { revoked_at: new Date() } });
}
