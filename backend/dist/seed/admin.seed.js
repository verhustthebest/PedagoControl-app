"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = __importDefault(require("../prisma/client"));
const seed_security_1 = require("./seed-security");
dotenv_1.default.config();
async function main() {
    (0, seed_security_1.assertSeedAllowed)('admin');
    const passwordHash = await bcrypt_1.default.hash((0, seed_security_1.seedPassword)('ADMIN_SEED_PASSWORD'), 10);
    const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
    if (!email)
        throw new Error('ADMIN_SEED_EMAIL is required');
    const role = await client_1.default.roles.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {
            label: 'Super Administrateur',
            description: 'Acces complet a CONTRÔLE PÉDAGOGIQUE',
            is_active: true,
        },
        create: {
            name: 'SUPER_ADMIN',
            label: 'Super Administrateur',
            description: 'Acces complet a CONTRÔLE PÉDAGOGIQUE',
            is_active: true,
        },
    });
    const user = await client_1.default.users.upsert({
        where: { email },
        update: {
            first_name: 'Admin',
            last_name: 'PÉDAGOGIQUE',
            password_hash: passwordHash,
            is_active: true,
        },
        create: {
            first_name: 'Admin',
            last_name: 'PÉDAGOGIQUE',
            email,
            password_hash: passwordHash,
            is_active: true,
        },
    });
    await client_1.default.user_roles.upsert({
        where: {
            user_id_role_id: {
                user_id: user.id,
                role_id: role.id,
            },
        },
        update: {},
        create: {
            user_id: user.id,
            role_id: role.id,
        },
    });
    console.log('Seed admin completed without printing credentials');
}
main()
    .catch((error) => {
    console.error('Seed admin failed');
    process.exitCode = 1;
})
    .finally(async () => {
    await client_1.default.$disconnect();
});
