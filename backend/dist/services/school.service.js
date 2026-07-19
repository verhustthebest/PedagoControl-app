"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSchoolSelect = void 0;
exports.listSchools = listSchools;
exports.findSchoolByInternalScope = findSchoolByInternalScope;
const client_1 = __importDefault(require("../prisma/client"));
/** Projection commune à la liste et au détail, volontairement sans identifiant numérique. */
exports.publicSchoolSelect = {
    public_id: true, code: true, name: true, promoter_name: true, phone: true, status: true, created_at: true,
};
/** Recherche paginée avec filtres allow-listés et portée scolaire optionnelle. */
async function listSchools(input) { const where = { ...(input.schoolId ? { id: input.schoolId } : {}), ...(input.status ? { status: input.status } : {}), ...(input.search ? { OR: [{ name: { contains: input.search, mode: 'insensitive' } }, { code: { contains: input.search, mode: 'insensitive' } }, { promoter_name: { contains: input.search, mode: 'insensitive' } }] } : {}) }; const [schools, total] = await client_1.default.$transaction([client_1.default.schools.findMany({ where, select: exports.publicSchoolSelect, orderBy: { created_at: 'desc' }, skip: (input.page - 1) * input.limit, take: input.limit }), client_1.default.schools.count({ where })]); return { schools, total }; }
/** Charge le détail après résolution sécurisée du public_id par requireSchoolScope. */
function findSchoolByInternalScope(schoolId) { return client_1.default.schools.findUnique({ where: { id: schoolId }, select: exports.publicSchoolSelect }); }
