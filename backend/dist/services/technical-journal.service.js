"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTechnicalJournals = listTechnicalJournals;
exports.getTechnicalJournal = getTechnicalJournal;
const node_crypto_1 = require("node:crypto");
const client_1 = __importDefault(require("../prisma/client"));
const parental_service_1 = require("./parental.service");
const day = (value) => { const raw = value ?? new Date().toISOString().slice(0, 10); const date = new Date(`${raw}T00:00:00.000Z`); if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw)
    throw new parental_service_1.ParentalApiError('Invalid query', 400); return date; };
const secret = () => process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'development-only-technical-journal-key';
/** Produit un identifiant opaque authentifié sans exposer les clés BigInt internes. */
function publicJournalId(studentPublicId, date) { const payload = `${studentPublicId}.${date.toISOString().slice(0, 10)}`; const signature = (0, node_crypto_1.createHmac)('sha256', secret()).update(payload).digest('base64url').slice(0, 24); return Buffer.from(`${payload}.${signature}`).toString('base64url'); }
function readPublicJournalId(value) { try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 3)
        throw new Error();
    const [p, d, s] = parts;
    const expected = (0, node_crypto_1.createHmac)('sha256', secret()).update(`${p}.${d}`).digest('base64url').slice(0, 24);
    if (s.length !== expected.length || !(0, node_crypto_1.timingSafeEqual)(Buffer.from(s), Buffer.from(expected)))
        throw new Error();
    return { studentPublicId: p, date: day(d) };
}
catch {
    throw new parental_service_1.ParentalApiError('Resource not found', 404);
} }
const lessonWhere = (schoolId, date, classPublicId) => ({ actual_date: date, lesson_validations: { some: { decision: 'validated' } }, teacher_assignments: { academic_year_subjects: { academic_year_classes: { ...(classPublicId ? { public_id: classPublicId } : {}), academic_years: { school_id: schoolId } } } } });
/** Construit la vue technique depuis les cours validés, inscriptions et visas existants, en lecture seule. */
async function listTechnicalJournals(schoolIdValue, filters) { const schoolId = BigInt(schoolIdValue), date = day(filters.date), page = Number(filters.page || 1), limit = Number(filters.limit || 20); const lessons = await client_1.default.lesson_sessions.findMany({ where: lessonWhere(schoolId, date, filters.class_id), select: { actual_date: true, teacher_assignments: { select: { academic_year_subjects: { select: { academic_year_classes: { select: { id: true, public_id: true, school_classes: { select: { public_id: true, name: true } } } } } } } } } }); const classes = new Map(); for (const lesson of lessons) {
    const c = lesson.teacher_assignments.academic_year_subjects.academic_year_classes, k = c.id.toString(), current = classes.get(k);
    classes.set(k, { id: c.id, public_id: c.public_id, class_public_id: c.school_classes.public_id, name: c.school_classes.name, lessons: (current?.lessons || 0) + 1 });
} if (!classes.size)
    return { journals: [], pagination: { page, limit, total: 0, total_pages: 0 } }; const enrollments = await client_1.default.student_enrollments.findMany({ where: { academic_year_class_id: { in: [...classes.values()].map(c => c.id) }, parental_tracking_enabled: true, ...(filters.student_id ? { students: { public_id: filters.student_id } } : {}) }, select: { academic_year_class_id: true, students: { select: { id: true, public_id: true, first_name: true, last_name: true, matricule: true } } } }); const acknowledgements = await client_1.default.parent_daily_acknowledgements.findMany({ where: { journal_date: date, academic_year_class_id: { in: [...classes.values()].map(c => c.id) }, guardians: { school_id: schoolId } }, select: { student_id: true, acknowledged_at: true, lesson_count_snapshot: true, guardians: { select: { public_id: true, first_name: true, last_name: true } } } }); const ack = new Map(acknowledgements.map(a => [a.student_id.toString(), a])); const all = enrollments.map(e => { const c = classes.get(e.academic_year_class_id.toString()), a = ack.get(e.students.id.toString()); return { public_id: publicJournalId(e.students.public_id, date), date: date.toISOString().slice(0, 10), status: a ? 'Vise' : 'Non vise', lesson_count: a?.lesson_count_snapshot ?? c.lessons, acknowledged_at: a?.acknowledged_at ?? null, student: { public_id: e.students.public_id, first_name: e.students.first_name, last_name: e.students.last_name, matricule: e.students.matricule }, class: { public_id: c.class_public_id, academic_year_class_public_id: c.public_id, name: c.name }, guardian: a ? { public_id: a.guardians.public_id, first_name: a.guardians.first_name, last_name: a.guardians.last_name } : null }; }).filter(item => !filters.status || (filters.status === 'vise' ? item.status === 'Vise' : item.status === 'Non vise')); const total = all.length; return { journals: all.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } }; }
/** Résout le détail dans la portée école puis enrichit les leçons, sans action d'écriture. */
async function getTechnicalJournal(schoolId, journalPublicId) { const parsed = readPublicJournalId(journalPublicId); const result = await listTechnicalJournals(schoolId, { date: parsed.date.toISOString().slice(0, 10), student_id: parsed.studentPublicId, page: '1', limit: '100' }); const journal = result.journals.find(item => item.public_id === journalPublicId); if (!journal)
    throw new parental_service_1.ParentalApiError('Resource not found', 404); const lessons = await client_1.default.lesson_sessions.findMany({ where: { ...lessonWhere(BigInt(schoolId), parsed.date), teacher_assignments: { academic_year_subjects: { academic_year_classes: { public_id: journal.class.academic_year_class_public_id, academic_years: { school_id: BigInt(schoolId) } } } } }, select: { actual_start_time: true, actual_end_time: true, lesson_summary: true, homework_given: true, observations: true, users: { select: { first_name: true, last_name: true } }, teacher_assignments: { select: { academic_year_subjects: { select: { subjects: { select: { name: true } } } } } } }, orderBy: { actual_start_time: 'asc' } }); return { journal: { ...journal, lessons: lessons.map(l => ({ subject: l.teacher_assignments.academic_year_subjects.subjects.name, teacher: { first_name: l.users.first_name, last_name: l.users.last_name }, start_time: l.actual_start_time, end_time: l.actual_end_time, summary: l.lesson_summary, homework: l.homework_given, observations: l.observations })) } }; }
