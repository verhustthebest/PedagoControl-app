"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGuardians = listGuardians;
exports.getGuardian = getGuardian;
exports.createGuardian = createGuardian;
exports.updateGuardian = updateGuardian;
exports.linkGuardianToStudent = linkGuardianToStudent;
exports.setStudentGuardianEnabled = setStudentGuardianEnabled;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const parental_service_1 = require("./parental.service");
const phone_identity_1 = require("../security/phone-identity");
const guardianInclude = {
    student_guardians: {
        include: {
            students: {
                select: {
                    id: true,
                    matricule: true,
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    status: true,
                },
            },
        },
        orderBy: { created_at: 'desc' },
    },
};
function parseId(value, field) {
    try {
        const id = BigInt(value);
        if (id <= 0n)
            throw new Error();
        return id;
    }
    catch {
        throw new parental_service_1.ParentalApiError(`${field} must be a valid positive id`, 400);
    }
}
function requiredText(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new parental_service_1.ParentalApiError(`${field} is required`, 400);
    }
    return value.trim();
}
function nullableText(value, field) {
    if (value === undefined || value === null || value === '')
        return null;
    return requiredText(value, field);
}
function normalizeEmail(value) {
    const email = nullableText(value, 'email')?.toLowerCase() ?? null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new parental_service_1.ParentalApiError('email must be valid', 400);
    }
    return email;
}
function normalizePhone(value) {
    const phone = nullableText(value, 'phone');
    if (!phone)
        return null;
    try {
        return (0, phone_identity_1.normalizeDrcPhone)(phone);
    }
    catch {
        throw new parental_service_1.ParentalApiError('Le numéro doit être un numéro congolais valide au format +243.', 400);
    }
}
function parsePage(value, fallback, maximum) {
    if (value === undefined)
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || (maximum && parsed > maximum)) {
        throw new parental_service_1.ParentalApiError(maximum ? `limit must be between 1 and ${maximum}` : 'page must be positive', 400);
    }
    return parsed;
}
function audit(params) {
    return {
        school_id: params.schoolId,
        user_id: params.userId,
        activity_type: params.type,
        module_name: 'parental_tracking',
        reference_table: params.referenceTable,
        reference_id: params.referenceId,
        title: params.title,
        description: params.description,
    };
}
async function ensureSchool(schoolId) {
    const school = await client_2.default.schools.findUnique({ where: { id: schoolId }, select: { id: true } });
    if (!school)
        throw new parental_service_1.ParentalApiError('School not found', 404);
}
async function findGuardian(schoolId, guardianId) {
    const guardian = await client_2.default.guardians.findFirst({
        where: { id: guardianId, school_id: schoolId },
        include: guardianInclude,
    });
    if (!guardian)
        throw new parental_service_1.ParentalApiError('Guardian not found in this school', 404);
    return guardian;
}
function contactDuplicateWhere(schoolId, phone, email, excludeId) {
    const contacts = [];
    if (phone)
        contacts.push({ phone });
    if (email)
        contacts.push({ email: { equals: email, mode: 'insensitive' } });
    return {
        school_id: schoolId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: contacts,
    };
}
async function listGuardians(schoolIdValue, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    await ensureSchool(schoolId);
    const page = parsePage(input.page, 1);
    const limit = parsePage(input.limit, 20, 100);
    const search = input.search?.trim();
    const where = {
        school_id: schoolId,
        ...(input.status ? { status: input.status } : {}),
        ...(search
            ? {
                OR: [
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                    { middle_name: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [guardians, total] = await client_2.default.$transaction([
        client_2.default.guardians.findMany({
            where,
            include: guardianInclude,
            orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
        client_2.default.guardians.count({ where }),
    ]);
    return {
        guardians,
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}
async function getGuardian(schoolIdValue, guardianIdValue) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const guardianId = parseId(guardianIdValue, 'guardianId');
    await ensureSchool(schoolId);
    return findGuardian(schoolId, guardianId);
}
async function createGuardian(schoolIdValue, actorUserId, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const actorId = parseId(actorUserId, 'actorUserId');
    await ensureSchool(schoolId);
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    if (!phone && !email)
        throw new parental_service_1.ParentalApiError('phone or email is required', 400);
    try {
        return await client_2.default.$transaction(async (transaction) => {
            const duplicate = await transaction.guardians.findFirst({
                where: contactDuplicateWhere(schoolId, phone, email),
                select: { id: true },
            });
            if (duplicate)
                throw new parental_service_1.ParentalApiError(phone ? phone_identity_1.PHONE_CONFLICT_MESSAGE : 'A guardian with this email already exists', 409);
            const guardian = await transaction.guardians.create({
                data: {
                    school_id: schoolId,
                    created_by_user_id: actorId,
                    first_name: requiredText(input.first_name, 'first_name'),
                    last_name: requiredText(input.last_name, 'last_name'),
                    middle_name: nullableText(input.middle_name, 'middle_name'),
                    phone,
                    email,
                    national_id_number: nullableText(input.national_id_number, 'national_id_number'),
                    occupation: nullableText(input.occupation, 'occupation'),
                    address: nullableText(input.address, 'address'),
                    preferred_contact_method: nullableText(input.preferred_contact_method, 'preferred_contact_method'),
                    status: input.status ? requiredText(input.status, 'status') : 'active',
                },
            });
            await transaction.activity_logs.create({
                data: audit({
                    schoolId,
                    userId: actorId,
                    referenceTable: 'guardians',
                    referenceId: guardian.id,
                    type: 'parental_guardian_created',
                    title: 'Creation d un parent ou tuteur',
                    description: 'Un parent ou tuteur a ete enregistre sans creation de compte utilisateur.',
                }),
            });
            return transaction.guardians.findUniqueOrThrow({
                where: { id: guardian.id },
                include: guardianInclude,
            });
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    catch (error) {
        if (error instanceof parental_service_1.ParentalApiError)
            throw error;
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
            throw new parental_service_1.ParentalApiError('A concurrent guardian creation conflict occurred', 409);
        }
        throw error;
    }
}
async function updateGuardian(schoolIdValue, guardianIdValue, actorUserId, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const guardianId = parseId(guardianIdValue, 'guardianId');
    const actorId = parseId(actorUserId, 'actorUserId');
    await ensureSchool(schoolId);
    const existing = await findGuardian(schoolId, guardianId);
    const phone = input.phone === undefined ? existing.phone : normalizePhone(input.phone);
    const email = input.email === undefined ? existing.email : normalizeEmail(input.email);
    if (!phone && !email)
        throw new parental_service_1.ParentalApiError('phone or email is required', 400);
    return client_2.default.$transaction(async (transaction) => {
        const duplicate = await transaction.guardians.findFirst({
            where: contactDuplicateWhere(schoolId, phone, email, guardianId),
            select: { id: true },
        });
        if (duplicate)
            throw new parental_service_1.ParentalApiError(phone ? phone_identity_1.PHONE_CONFLICT_MESSAGE : 'A guardian with this email already exists', 409);
        const guardian = await transaction.guardians.update({
            where: { id: guardianId },
            data: {
                ...(input.first_name !== undefined ? { first_name: requiredText(input.first_name, 'first_name') } : {}),
                ...(input.last_name !== undefined ? { last_name: requiredText(input.last_name, 'last_name') } : {}),
                ...(input.middle_name !== undefined ? { middle_name: nullableText(input.middle_name, 'middle_name') } : {}),
                ...(input.phone !== undefined ? { phone } : {}),
                ...(input.email !== undefined ? { email } : {}),
                ...(input.national_id_number !== undefined
                    ? { national_id_number: nullableText(input.national_id_number, 'national_id_number') }
                    : {}),
                ...(input.occupation !== undefined ? { occupation: nullableText(input.occupation, 'occupation') } : {}),
                ...(input.address !== undefined ? { address: nullableText(input.address, 'address') } : {}),
                ...(input.preferred_contact_method !== undefined
                    ? { preferred_contact_method: nullableText(input.preferred_contact_method, 'preferred_contact_method') }
                    : {}),
                ...(input.status !== undefined ? { status: requiredText(input.status, 'status') } : {}),
                updated_at: new Date(),
            },
        });
        await transaction.activity_logs.create({
            data: audit({
                schoolId,
                userId: actorId,
                referenceTable: 'guardians',
                referenceId: guardian.id,
                type: 'parental_guardian_updated',
                title: 'Modification d un parent ou tuteur',
                description: 'Les informations du parent ou tuteur ont ete mises a jour.',
            }),
        });
        return transaction.guardians.findUniqueOrThrow({
            where: { id: guardian.id },
            include: guardianInclude,
        });
    }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
}
async function linkGuardianToStudent(schoolIdValue, studentIdValue, actorUserId, input) {
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const studentId = parseId(studentIdValue, 'studentId');
    const actorId = parseId(actorUserId, 'actorUserId');
    const guardianId = parseId(requiredText(input.guardian_id, 'guardian_id'), 'guardian_id');
    const relationshipType = requiredText(input.relationship_type, 'relationship_type');
    const [student, guardian] = await Promise.all([
        client_2.default.students.findFirst({ where: { id: studentId, school_id: schoolId }, select: { id: true } }),
        client_2.default.guardians.findFirst({ where: { id: guardianId, school_id: schoolId }, select: { id: true } }),
    ]);
    if (!student)
        throw new parental_service_1.ParentalApiError('Student not found in this school', 404);
    if (!guardian)
        throw new parental_service_1.ParentalApiError('Guardian not found in this school', 404);
    const existing = await client_2.default.student_guardians.findUnique({
        where: { student_id_guardian_id: { student_id: studentId, guardian_id: guardianId } },
        select: { id: true },
    });
    if (existing)
        throw new parental_service_1.ParentalApiError('This guardian is already linked to this student', 409);
    return client_2.default.$transaction(async (transaction) => {
        const link = await transaction.student_guardians.create({
            data: {
                student_id: studentId,
                guardian_id: guardianId,
                relationship_type: relationshipType,
                is_primary: input.is_primary ?? false,
                can_receive_alerts: input.can_receive_alerts ?? true,
                can_view_journal: input.can_view_journal ?? true,
                status: 'active',
                validated_by_user_id: actorId,
                validated_at: new Date(),
            },
            include: { guardians: true, students: true },
        });
        await transaction.activity_logs.create({
            data: audit({
                schoolId,
                userId: actorId,
                referenceTable: 'student_guardians',
                referenceId: link.id,
                type: 'parental_student_link_created',
                title: 'Rattachement parent-enfant',
                description: 'Un parent ou tuteur a ete rattache a un eleve de la meme ecole.',
            }),
        });
        return link;
    });
}
async function setStudentGuardianEnabled(schoolIdValue, studentIdValue, guardianIdValue, actorUserId, enabled) {
    if (typeof enabled !== 'boolean')
        throw new parental_service_1.ParentalApiError('enabled must be a boolean', 400);
    const schoolId = parseId(schoolIdValue, 'schoolId');
    const studentId = parseId(studentIdValue, 'studentId');
    const guardianId = parseId(guardianIdValue, 'guardianId');
    const actorId = parseId(actorUserId, 'actorUserId');
    const link = await client_2.default.student_guardians.findFirst({
        where: {
            student_id: studentId,
            guardian_id: guardianId,
            students: { school_id: schoolId },
            guardians: { school_id: schoolId },
        },
    });
    if (!link)
        throw new parental_service_1.ParentalApiError('Guardian link not found in this school', 404);
    const status = enabled ? 'active' : 'inactive';
    return client_2.default.$transaction(async (transaction) => {
        const updated = await transaction.student_guardians.update({
            where: { id: link.id },
            data: {
                status,
                ...(enabled ? { validated_by_user_id: actorId, validated_at: new Date() } : {}),
                updated_at: new Date(),
            },
            include: { guardians: true, students: true },
        });
        if (link.status !== status) {
            await transaction.activity_logs.create({
                data: audit({
                    schoolId,
                    userId: actorId,
                    referenceTable: 'student_guardians',
                    referenceId: link.id,
                    type: enabled ? 'parental_student_link_activated' : 'parental_student_link_disabled',
                    title: enabled ? 'Activation du rattachement parent-enfant' : 'Desactivation du rattachement parent-enfant',
                    description: enabled
                        ? 'Le rattachement parent-enfant a ete active.'
                        : 'Le rattachement parent-enfant a ete desactive sans suppression de l historique.',
                }),
            });
        }
        return updated;
    });
}
