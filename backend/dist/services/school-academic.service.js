"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolAcademicError = void 0;
exports.createClass = createClass;
exports.updateClass = updateClass;
exports.deactivateClass = deactivateClass;
exports.listCatalog = listCatalog;
exports.listSubjects = listSubjects;
exports.saveSubject = saveSubject;
exports.removeSubject = removeSubject;
const client_1 = __importDefault(require("../prisma/client"));
const crypto_1 = require("crypto");
const rdc_school_reference_1 = require("./rdc-school-reference");
class SchoolAcademicError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
exports.SchoolAcademicError = SchoolAcademicError;
const activeYear = (schoolId) => client_1.default.academic_years.findFirst({ where: { school_id: schoolId, is_active: true }, orderBy: { start_date: 'desc' }, select: { id: true, public_id: true, name: true } });
const normalize = (value) => value.trim().replace(/\s+/g, ' ');
const comparisonKey = (value) => normalize(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr');
const opaque = (schoolId, kind, id) => { const h = (0, crypto_1.createHash)('sha256').update(`${kind}:${schoolId}:${id}`).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
/** Crée une classe et son rattachement à l'année active sous une seule transaction. */
async function resolveOption(level, section, custom) {
    const requested = custom ? normalize(custom) : section ? normalize(section) : '';
    if (!requested)
        return null;
    const candidates = await client_1.default.education_options.findMany({ where: { is_active: true } });
    const existing = candidates.find(option => comparisonKey(option.name) === comparisonKey(requested));
    if (existing) {
        if (custom) {
            const levels = new Set([...(0, rdc_school_reference_1.referencedLevels)(existing.description), level]);
            if (levels.size !== (0, rdc_school_reference_1.referencedLevels)(existing.description).length)
                return client_1.default.education_options.update({ where: { id: existing.id }, data: { description: (0, rdc_school_reference_1.referenceDescription)([...levels], false) } });
        }
        return existing;
    }
    if (!custom)
        throw new SchoolAcademicError('Section scolaire inconnue.', 400);
    return client_1.default.education_options.create({ data: { name: requested, description: (0, rdc_school_reference_1.referenceDescription)([level], false) } });
}
async function createClass(schoolId, input) {
    const year = await activeYear(schoolId);
    if (!year)
        throw new SchoolAcademicError('Aucune année scolaire active.', 409);
    const level = await client_1.default.education_levels.findFirst({ where: { name: { equals: normalize(input.level), mode: 'insensitive' }, is_active: true } });
    if (!level)
        throw new SchoolAcademicError('Niveau scolaire inconnu.', 400);
    const option = await resolveOption(level.name, input.section, input.section_other);
    return client_1.default.$transaction(async (tx) => {
        const schoolClass = await tx.school_classes.create({ data: { school_id: schoolId, education_level_id: level.id, education_option_id: option?.id, name: normalize(input.name), parallel: input.parallel || null } });
        const annual = await tx.academic_year_classes.create({ data: { academic_year_id: year.id, school_class_id: schoolClass.id }, select: { public_id: true, is_active: true } });
        return { public_id: annual.public_id, is_active: annual.is_active, academic_year: { public_id: year.public_id, name: year.name }, class: { public_id: schoolClass.public_id, name: schoolClass.name, parallel: schoolClass.parallel, level: level.name, section: option?.name ?? null, is_active: schoolClass.is_active } };
    });
}
async function updateClass(schoolId, annualPublicId, input) {
    const annual = await client_1.default.academic_year_classes.findFirst({ where: { public_id: annualPublicId, academic_years: { school_id: schoolId } }, select: { school_class_id: true } });
    if (!annual)
        throw new SchoolAcademicError('Ressource introuvable.', 404);
    const level = await client_1.default.education_levels.findFirst({ where: { name: { equals: normalize(input.level), mode: 'insensitive' }, is_active: true } });
    if (!level)
        throw new SchoolAcademicError('Niveau inconnu.', 400);
    const option = await resolveOption(level.name, input.section, input.section_other);
    const item = await client_1.default.school_classes.update({ where: { id: annual.school_class_id }, data: { name: normalize(input.name), parallel: input.parallel || null, education_level_id: level.id, education_option_id: option?.id ?? null }, select: { public_id: true, name: true, parallel: true, is_active: true } });
    return { ...item, level: level.name, section: option?.name ?? null };
}
async function deactivateClass(schoolId, annualPublicId) { const annual = await client_1.default.academic_year_classes.findFirst({ where: { public_id: annualPublicId, academic_years: { school_id: schoolId } }, select: { id: true, school_class_id: true } }); if (!annual)
    throw new SchoolAcademicError('Ressource introuvable.', 404); await client_1.default.$transaction([client_1.default.academic_year_classes.update({ where: { id: annual.id }, data: { is_active: false } }), client_1.default.school_classes.update({ where: { id: annual.school_class_id }, data: { is_active: false } })]); }
async function listCatalog() { const [levels, sections] = await Promise.all([client_1.default.education_levels.findMany({ where: { is_active: true }, select: { name: true }, orderBy: { order_index: 'asc' } }), client_1.default.education_options.findMany({ where: { is_active: true }, select: { name: true, description: true }, orderBy: { name: 'asc' } })]); const names = levels.map(x => x.name); return { levels: names, sections: sections.map(x => x.name), options_by_level: Object.fromEntries(names.map(level => [level, sections.filter(option => { const scoped = (0, rdc_school_reference_1.referencedLevels)(option.description); return scoped.length ? scoped.includes(level) : (0, rdc_school_reference_1.optionsForLevel)(level).includes(option.name); }).map(option => option.name)])) }; }
async function listSubjects(schoolId) { const year = await activeYear(schoolId); if (!year)
    return []; const rows = await client_1.default.academic_year_subjects.findMany({ where: { academic_year_classes: { academic_year_id: year.id } }, select: { id: true, is_active: true, subject_id: true, subjects: { select: { name: true, code: true, description: true } }, academic_year_classes: { select: { public_id: true, school_classes: { select: { public_id: true, name: true, parallel: true } } } } }, orderBy: { subjects: { name: 'asc' } } }); const map = new Map(); for (const row of rows) {
    const key = row.subject_id.toString(), item = map.get(key) || { public_id: opaque(schoolId, 'subject', row.subject_id), ...row.subjects, class_subject_ids: [], classes: [] };
    item.class_subject_ids.push(opaque(schoolId, 'class-subject', row.id));
    item.classes.push({ annual_class_public_id: row.academic_year_classes.public_id, public_id: row.academic_year_classes.school_classes.public_id, name: row.academic_year_classes.school_classes.name, parallel: row.academic_year_classes.school_classes.parallel });
    map.set(key, item);
} return [...map.values()]; }
async function saveSubject(schoolId, input, subjectPublicId) {
    const classes = await client_1.default.academic_year_classes.findMany({ where: { public_id: { in: input.class_ids }, academic_years: { school_id: schoolId, is_active: true } }, select: { id: true } });
    if (classes.length !== new Set(input.class_ids).size)
        throw new SchoolAcademicError('Classe invalide.', 400);
    const existing = subjectPublicId ? await client_1.default.academic_year_subjects.findMany({ where: { academic_year_classes: { academic_years: { school_id: schoolId } } }, select: { subject_id: true } }) : [];
    const existingSubjectId = existing.find(x => opaque(schoolId, 'subject', x.subject_id) === subjectPublicId)?.subject_id;
    return client_1.default.$transaction(async (tx) => { let subject = existingSubjectId ? await tx.subjects.findUnique({ where: { id: existingSubjectId } }) : await tx.subjects.findFirst({ where: { name: { equals: normalize(input.name), mode: 'insensitive' } } }); if (subjectPublicId && !subject)
        throw new SchoolAcademicError('Ressource introuvable.', 404); subject = subject ? await tx.subjects.update({ where: { id: subject.id }, data: { name: normalize(input.name), code: input.code || null, description: input.description || null, is_active: true } }) : await tx.subjects.create({ data: { name: normalize(input.name), code: input.code || null, description: input.description || null } }); await tx.academic_year_subjects.deleteMany({ where: { subject_id: subject.id, academic_year_classes: { academic_years: { school_id: schoolId, is_active: true } } } }); await tx.academic_year_subjects.createMany({ data: classes.map(c => ({ academic_year_class_id: c.id, subject_id: subject.id })), skipDuplicates: true }); return { public_id: opaque(schoolId, 'subject', subject.id), name: subject.name }; });
}
async function removeSubject(schoolId, publicId) { const links = await client_1.default.academic_year_subjects.findMany({ where: { academic_year_classes: { academic_years: { school_id: schoolId } } }, select: { subject_id: true } }), subjectId = links.find(x => opaque(schoolId, 'subject', x.subject_id) === publicId)?.subject_id; if (!subjectId)
    throw new SchoolAcademicError('Ressource introuvable.', 404); await client_1.default.academic_year_subjects.deleteMany({ where: { subject_id: subjectId, academic_year_classes: { academic_years: { school_id: schoolId, is_active: true } } } }); }
