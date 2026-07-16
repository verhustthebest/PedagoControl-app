"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHOOL_LIST_ROLES = exports.SUPERVISION_ROLES = exports.PREFECT_ROLES = exports.TEACHER_ROLES = void 0;
exports.hasAnyRole = hasAnyRole;
exports.isSuperAdmin = isSuperAdmin;
exports.hasUsableSchoolContext = hasUsableSchoolContext;
exports.canBroadcast = canBroadcast;
exports.canListAllSchools = canListAllSchools;
exports.TEACHER_ROLES = ['ENSEIGNANT'];
exports.PREFECT_ROLES = [
    'PREFET',
    'PREFET_DES_ETUDES',
    'DIRECTEUR_ETUDES',
    'DIRECTEUR_DES_ETUDES',
];
exports.SUPERVISION_ROLES = [
    'SUPER_ADMIN',
    'ADMIN_GESTIONNAIRE',
    'PROMOTEUR',
    'DIRECTEUR',
    'DIRECTION',
    'MANAGEMENT',
];
exports.SCHOOL_LIST_ROLES = ['SUPER_ADMIN', 'MANAGEMENT'];
function hasAnyRole(identity, allowedRoles) {
    return identity.roles.some((role) => allowedRoles.includes(role));
}
function isSuperAdmin(identity) {
    return identity.roles.includes('SUPER_ADMIN');
}
function hasUsableSchoolContext(identity) {
    return identity.school_id !== null || isSuperAdmin(identity);
}
function canBroadcast(identity) {
    if (hasAnyRole(identity, ['PARENT', 'ENSEIGNANT']))
        return false;
    if (identity.school_id !== null) {
        return identity.permissions.includes('BROADCAST_SCHOOL_MESSAGES');
    }
    return isSuperAdmin(identity) && identity.permissions.includes('BROADCAST_GLOBAL_MESSAGES');
}
function canListAllSchools(identity) {
    return isSuperAdmin(identity) || hasAnyRole(identity, exports.SCHOOL_LIST_ROLES);
}
