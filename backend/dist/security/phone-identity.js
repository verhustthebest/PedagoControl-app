"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneIdentityError = exports.PHONE_CONFLICT_MESSAGE = void 0;
exports.normalizeDrcPhone = normalizeDrcPhone;
exports.checkPhoneIdentity = checkPhoneIdentity;
exports.assertPhoneAvailable = assertPhoneAvailable;
const client_1 = __importDefault(require("../prisma/client"));
exports.PHONE_CONFLICT_MESSAGE = 'Ce numéro de téléphone est déjà associé à un autre compte utilisateur. Vérifiez le numéro ou sélectionnez la personne existante.';
class PhoneIdentityError extends Error {
    constructor(message = exports.PHONE_CONFLICT_MESSAGE, status = 409) {
        super(message);
        this.status = status;
    }
}
exports.PhoneIdentityError = PhoneIdentityError;
/** Normalise les variantes 0…, 243… et 00243… vers +243XXXXXXXXX. */
function normalizeDrcPhone(value) { let digits = value.trim().replace(/\D/g, ''); if (digits.startsWith('00243'))
    digits = digits.slice(2); if (digits.startsWith('0'))
    digits = `243${digits.slice(1)}`;
else if (digits.length === 9)
    digits = `243${digits}`; if (!/^243\d{9}$/.test(digits))
    throw new PhoneIdentityError('Le numéro doit être un numéro congolais valide au format +243.', 400); return `+${digits}`; }
const key = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[\s'-]+/g, '').toLowerCase();
const same = (first, last, item) => { const expected = key(`${first}${last}`); return expected === key(`${item.first_name}${item.last_name}`) || expected === key(`${item.first_name}${item.last_name}${item.middle_name || ''}`); };
const stored = (value) => { try {
    return normalizeDrcPhone(value);
}
catch {
    return value.replace(/[\s().-]/g, '');
} };
/** Contrôle commun des utilisateurs et contacts Parent, limité à l'école lorsque nécessaire. */
async function checkPhoneIdentity(input, client = client_1.default) { const phone = normalizeDrcPhone(input.phone); const [users, guardians] = await Promise.all([client.users.findMany({ where: { phone: { not: null } }, select: { public_id: true, first_name: true, last_name: true, phone: true } }), client.guardians.findMany({ where: { phone: { not: null } }, select: { public_id: true, first_name: true, last_name: true, middle_name: true, phone: true, user_id: true } })]); const user = users.find(item => item.phone && stored(item.phone) === phone); if (user)
    return same(input.first_name, input.last_name, user) ? { status: 'REUSE_ACCOUNT', normalized_phone: phone, person: { public_id: user.public_id, first_name: user.first_name, last_name: user.last_name } } : { status: 'CONFLICT', normalized_phone: phone }; const guardian = guardians.find(item => item.phone && stored(item.phone) === phone); if (guardian)
    return same(input.first_name, input.last_name, guardian) && !guardian.user_id ? { status: 'CONTACT_WITHOUT_ACCOUNT', normalized_phone: phone, person: { public_id: guardian.public_id, first_name: guardian.first_name, last_name: guardian.last_name } } : same(input.first_name, input.last_name, guardian) ? { status: 'REUSE_ACCOUNT', normalized_phone: phone, person: { public_id: guardian.public_id, first_name: guardian.first_name, last_name: guardian.last_name } } : { status: 'CONFLICT', normalized_phone: phone }; return { status: 'AVAILABLE', normalized_phone: phone }; }
async function assertPhoneAvailable(input, client = client_1.default) { const result = await checkPhoneIdentity(input, client); if (result.status === 'CONFLICT' || result.status === 'REUSE_ACCOUNT')
    throw new PhoneIdentityError(); return result; }
