"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = __importDefault(require("../prisma/client"));
dotenv_1.default.config();
async function main() {
    const passwordHash = await bcrypt_1.default.hash('Admin12345', 10);
    const role = await client_1.default.roles.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {
            label: 'Super Administrateur',
            description: 'Acces complet a PEDAGO CONTROL',
            is_active: true,
        },
        create: {
            name: 'SUPER_ADMIN',
            label: 'Super Administrateur',
            description: 'Acces complet a PEDAGO CONTROL',
            is_active: true,
        },
    });
    const user = await client_1.default.users.upsert({
        where: { email: 'admin@test.com' },
        update: {
            first_name: 'Admin',
            last_name: 'PEDAGO',
            password_hash: passwordHash,
            is_active: true,
        },
        create: {
            first_name: 'Admin',
            last_name: 'PEDAGO',
            email: 'admin@test.com',
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
    console.log('Seed admin ready: admin@test.com / SUPER_ADMIN');
}
main()
    .catch((error) => {
    console.error('Seed admin failed', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await client_1.default.$disconnect();
});
