"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileSecurityError = void 0;
exports.changeUserPassword = changeUserPassword;
exports.replaceProfilePhoto = replaceProfilePhoto;
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = __importDefault(require("../prisma/client"));
const auth_session_service_1 = require("./auth-session.service");
class ProfileSecurityError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
exports.ProfileSecurityError = ProfileSecurityError;
/** Change le mot de passe au plus trois fois par mois puis révoque toutes les sessions. */
async function changeUserPassword(userId, currentPassword, newPassword) {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - 1);
    const user = await client_1.default.users.findUnique({ where: { id: BigInt(userId) }, select: { password_hash: true, school_id: true } });
    if (!user || !await bcrypt_1.default.compare(currentPassword, user.password_hash))
        throw new ProfileSecurityError('Le mot de passe actuel est incorrect.', 400);
    const changes = await client_1.default.activity_logs.count({ where: { user_id: BigInt(userId), activity_type: 'password_changed', created_at: { gte: since } } });
    if (changes >= 3)
        throw new ProfileSecurityError('La limite mensuelle de changements est atteinte.', 429);
    if (await bcrypt_1.default.compare(newPassword, user.password_hash))
        throw new ProfileSecurityError('Le nouveau mot de passe doit être différent.', 400);
    const hash = await bcrypt_1.default.hash(newPassword, 12);
    await client_1.default.$transaction(async (tx) => {
        await tx.users.update({ where: { id: BigInt(userId) }, data: { password_hash: hash } });
        if (user.school_id)
            await tx.activity_logs.create({ data: { school_id: user.school_id, user_id: BigInt(userId), activity_type: 'password_changed', module_name: 'security', title: 'Mot de passe modifié' } });
    });
    await (0, auth_session_service_1.revokeAllUserSessions)(userId);
}
/** Transmet l'image à un stockage externe ; aucune donnée n'est écrite sur le disque Heroku. */
async function replaceProfilePhoto(userId, input, fetcher = fetch) {
    const endpoint = process.env.PROFILE_STORAGE_ENDPOINT, token = process.env.PROFILE_STORAGE_TOKEN;
    if (!endpoint || !token)
        throw new ProfileSecurityError('Le stockage externe des profils n’est pas configuré.', 503);
    const response = await fetcher(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: input.data_url, mime_type: input.mime_type, folder: 'pedago-control/profiles' }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.secure_url || !/^https:\/\//.test(payload.secure_url))
        throw new ProfileSecurityError('Le stockage externe a refusé la photo.', 502);
    const user = await client_1.default.users.update({ where: { id: BigInt(userId) }, data: { profile_photo: payload.secure_url }, select: { public_id: true, profile_photo: true } });
    return user;
}
