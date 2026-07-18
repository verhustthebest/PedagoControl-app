"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteGuardian = inviteGuardian;
const client_1 = __importDefault(require("../prisma/client"));
const action_token_service_1 = require("./action-token.service");
const parental_service_1 = require("./parental.service");
/** Prépare une invitation opaque sans créer ni retourner de mot de passe temporaire. */
async function inviteGuardian(schoolId, guardianPublicId, actorId) { const guardian = await client_1.default.guardians.findFirst({ where: { public_id: guardianPublicId, school_id: BigInt(schoolId) } }); if (!guardian)
    throw new parental_service_1.ParentalApiError('Resource not found', 404); if (!guardian.email && !guardian.phone)
    throw new parental_service_1.ParentalApiError('Verified contact required', 409); if (!guardian.email_verified_at && !guardian.phone_verified_at)
    throw new parental_service_1.ParentalApiError('Verified contact required', 409); const issued = await (0, action_token_service_1.issueActionToken)('invitation', { guardianId: guardian.id.toString(), resourcePublicId: guardian.public_id }); await client_1.default.activity_logs.create({ data: { school_id: BigInt(schoolId), user_id: BigInt(actorId), activity_type: 'parent_invitation_issued', module_name: 'parental_tracking', reference_table: 'guardians', reference_id: guardian.id, title: 'Invitation Parent préparée', description: 'Une invitation opaque à usage unique a été préparée pour le canal vérifié.' } }); void issued; return { message: 'If the account is eligible, an invitation will be sent.', expires_in_minutes: Number(process.env.ACTION_TOKEN_TTL_MINUTES || 15) }; }
