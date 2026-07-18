"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = __importDefault(require("../prisma/client"));
dotenv_1.default.config();
const moduleName = 'Suivi parental';
const roleSeeds = [
    {
        name: 'SUPER_ADMIN',
        label: 'Super Administrateur',
        description: 'Acces complet a la plateforme',
    },
    {
        name: 'ADMIN_GESTIONNAIRE',
        label: 'Admin Gestionnaire',
        description: 'Gestion et supervision de l ecole',
    },
    {
        name: 'INFORMATICIEN',
        label: 'Informaticien',
        description: 'Gestion technique limitee de l ecole',
    },
    {
        name: 'PARENT',
        label: 'Parent',
        description: 'Acces limite a ses enfants et a ses donnees personnelles',
    },
];
const permissionSeeds = [
    { code: 'MANAGE_STUDENTS', label: 'Gerer les eleves', description: 'Creer, modifier et consulter les eleves.' },
    { code: 'MANAGE_GUARDIANS', label: 'Gerer les parents et tuteurs', description: 'Creer, modifier et consulter les parents et tuteurs.' },
    { code: 'MANAGE_STUDENT_LINKS', label: 'Gerer les liens eleves-parents', description: 'Gerer les rattachements entre eleves et parents ou tuteurs.' },
    { code: 'REVIEW_ATTACHMENT_REQUESTS', label: 'Examiner les demandes de rattachement', description: 'Accepter ou refuser les demandes de rattachement.' },
    { code: 'VIEW_ATTACHMENT_REQUESTS', label: 'Consulter les demandes de rattachement', description: 'Consulter les demandes sans nécessairement décider.' },
    { code: 'VIEW_SCHOOL_CLASSES', label: 'Consulter les classes', description: 'Consulter les classes de son école.' },
    { code: 'ASSIST_PARENT_ACCOUNTS', label: 'Assister les comptes parents', description: 'Fournir une assistance technique aux comptes parents.' },
    { code: 'VIEW_PARENTAL_JOURNALS', label: 'Consulter les journaux parentaux', description: 'Consulter techniquement les journaux accessibles aux parents.' },
    { code: 'VIEW_PARENTAL_ACKNOWLEDGEMENTS', label: 'Consulter les visas parentaux', description: 'Consulter les visas journaliers des parents.' },
    { code: 'SEND_PARENTAL_NOTIFICATIONS', label: 'Envoyer des notifications parentales', description: 'Envoyer des notifications aux parents.' },
    { code: 'REQUEST_CHILD_ATTACHMENT', label: 'Demander le rattachement d un enfant', description: 'Soumettre une demande de rattachement a un enfant.' },
    { code: 'VIEW_OWN_CHILDREN', label: 'Consulter ses enfants', description: 'Consulter uniquement ses propres enfants rattaches.' },
    { code: 'VIEW_OWN_DAILY_JOURNALS', label: 'Consulter ses journaux quotidiens', description: 'Consulter les journaux quotidiens de ses propres enfants.' },
    { code: 'ACKNOWLEDGE_DAILY_JOURNAL', label: 'Viser un journal quotidien', description: 'Effectuer le visa journalier pour ses propres enfants.' },
    { code: 'VIEW_OWN_NOTIFICATIONS', label: 'Consulter ses notifications', description: 'Consulter uniquement ses propres notifications.' },
    { code: 'MANAGE_OWN_PROFILE', label: 'Gerer son profil', description: 'Modifier uniquement ses propres donnees personnelles.' },
    { code: 'CONFIGURE_PARENTAL_MODULE', label: 'Configurer le Suivi parental', description: 'Activer et configurer le module pour une ecole.' },
    { code: 'MANAGE_PARENTAL_PRICING', label: 'Gerer le prix du Suivi parental', description: 'Modifier le prix applicable aux prochaines factures.' },
    { code: 'VIEW_PARENTAL_INVOICES', label: 'Consulter les factures du Suivi parental', description: 'Consulter les factures du Suivi parental emises pour une ecole.' },
    { code: 'GENERATE_PARENTAL_INVOICE', label: 'Generer une facture du Suivi parental', description: 'Generer la facture mensuelle adressee a une ecole.' },
    { code: 'RECORD_PARENTAL_PAYMENT', label: 'Enregistrer un paiement du Suivi parental', description: 'Enregistrer un paiement recu de l ecole.' },
    { code: 'PRINT_PARENTAL_INVOICE', label: 'Imprimer une facture du Suivi parental', description: 'Creer un acces temporaire a une facture emise.' },
    { code: 'VIEW_PARENT_CONTRIBUTIONS', label: 'Consulter les contributions Parent', description: 'Consulter les echeances Parent vers Ecole.' },
    { code: 'CONFIGURE_PARENT_CONTRIBUTION', label: 'Configurer les contributions Parent', description: 'Configurer la politique financiere Parent vers Ecole.' },
    { code: 'GENERATE_PARENT_CONTRIBUTION_DUES', label: 'Generer les echeances Parent', description: 'Generer les echeances mensuelles par enfant suivi.' },
    { code: 'RECORD_PARENT_CONTRIBUTION_PAYMENT', label: 'Enregistrer un paiement Parent', description: 'Enregistrer un paiement manuel recu par l ecole.' },
    { code: 'VIEW_OWN_PARENT_CONTRIBUTIONS', label: 'Consulter ses contributions', description: 'Consulter les echeances de ses enfants approuves.' },
    { code: 'AUDIT_PARENT_CONTRIBUTIONS', label: 'Auditer les contributions Parent', description: 'Audit global en lecture seule.' },
    { code: 'BROADCAST_SCHOOL_MESSAGES', label: 'Diffuser des messages dans une ecole', description: 'Diffuser un message collectif uniquement dans son ecole.' },
    { code: 'BROADCAST_GLOBAL_MESSAGES', label: 'Diffuser des messages globaux', description: 'Diffuser un message collectif a toutes les ecoles.' },
];
const schoolManagementPermissions = [
    'MANAGE_STUDENTS',
    'MANAGE_GUARDIANS',
    'MANAGE_STUDENT_LINKS',
    'REVIEW_ATTACHMENT_REQUESTS',
    'VIEW_ATTACHMENT_REQUESTS',
    'VIEW_SCHOOL_CLASSES',
    'ASSIST_PARENT_ACCOUNTS',
    'VIEW_PARENTAL_JOURNALS',
    'VIEW_PARENTAL_ACKNOWLEDGEMENTS',
    'SEND_PARENTAL_NOTIFICATIONS',
    'BROADCAST_SCHOOL_MESSAGES',
    'VIEW_PARENTAL_INVOICES',
    'PRINT_PARENTAL_INVOICE',
    'VIEW_PARENT_CONTRIBUTIONS',
    'CONFIGURE_PARENT_CONTRIBUTION',
    'GENERATE_PARENT_CONTRIBUTION_DUES',
    'RECORD_PARENT_CONTRIBUTION_PAYMENT',
];
const technicianPermissions = [
    'MANAGE_STUDENTS',
    'MANAGE_GUARDIANS',
    'MANAGE_STUDENT_LINKS',
    'VIEW_ATTACHMENT_REQUESTS',
    'VIEW_SCHOOL_CLASSES',
    'ASSIST_PARENT_ACCOUNTS',
    'VIEW_PARENTAL_JOURNALS',
    'VIEW_PARENTAL_ACKNOWLEDGEMENTS',
];
const parentPermissions = [
    'REQUEST_CHILD_ATTACHMENT',
    'VIEW_OWN_CHILDREN',
    'VIEW_OWN_DAILY_JOURNALS',
    'ACKNOWLEDGE_DAILY_JOURNAL',
    'VIEW_OWN_NOTIFICATIONS',
    'MANAGE_OWN_PROFILE',
    'VIEW_OWN_PARENT_CONTRIBUTIONS',
];
async function main() {
    const roles = await Promise.all(roleSeeds.map((role) => client_1.default.roles.upsert({
        where: { name: role.name },
        update: {
            label: role.label,
            description: role.description,
            is_active: true,
        },
        create: {
            name: role.name,
            label: role.label,
            description: role.description,
            is_active: true,
        },
    })));
    const permissions = await Promise.all(permissionSeeds.map((permission) => client_1.default.permissions.upsert({
        where: { code: permission.code },
        update: {
            label: permission.label,
            module: moduleName,
            description: permission.description,
            is_active: true,
        },
        create: {
            code: permission.code,
            label: permission.label,
            module: moduleName,
            description: permission.description,
            is_active: true,
        },
    })));
    const roleByName = new Map(roles.map((role) => [role.name, role]));
    const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));
    const modulePermissionIds = permissions.map((permission) => permission.id);
    const assignments = {
        SUPER_ADMIN: permissionSeeds.map((permission) => permission.code),
        ADMIN_GESTIONNAIRE: schoolManagementPermissions,
        INFORMATICIEN: technicianPermissions,
        PARENT: parentPermissions,
    };
    for (const [roleName, permissionCodes] of Object.entries(assignments)) {
        const role = roleByName.get(roleName);
        if (!role) {
            throw new Error(`Role introuvable: ${roleName}`);
        }
        const allowedPermissionIds = permissionCodes.map((code) => {
            const permission = permissionByCode.get(code);
            if (!permission) {
                throw new Error(`Permission introuvable: ${code}`);
            }
            return permission.id;
        });
        await client_1.default.role_permissions.deleteMany({
            where: {
                role_id: role.id,
                permission_id: {
                    in: modulePermissionIds,
                    notIn: allowedPermissionIds,
                },
            },
        });
        for (const permissionId of allowedPermissionIds) {
            await client_1.default.role_permissions.upsert({
                where: {
                    role_id_permission_id: {
                        role_id: role.id,
                        permission_id: permissionId,
                    },
                },
                update: {},
                create: {
                    role_id: role.id,
                    permission_id: permissionId,
                },
            });
        }
    }
    console.log('Seed access ready: roles and Suivi parental permissions synchronized');
}
main()
    .catch((error) => {
    console.error('Seed access failed');
    process.exitCode = 1;
})
    .finally(async () => {
    await client_1.default.$disconnect();
});
