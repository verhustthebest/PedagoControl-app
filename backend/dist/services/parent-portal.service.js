"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnChildren = getOwnChildren;
exports.getOwnChildJournals = getOwnChildJournals;
exports.acknowledgeOwnChildJournal = acknowledgeOwnChildJournal;
exports.getOwnNotifications = getOwnNotifications;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../prisma/client"));
const parental_service_1 = require("./parental.service");
const parental_student_service_1 = require("./parental-student.service");
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
function parseDate(value) {
    if (typeof value !== 'string')
        throw new parental_service_1.ParentalApiError('date must use YYYY-MM-DD', 400);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        throw new parental_service_1.ParentalApiError('date must use YYYY-MM-DD', 400);
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (date.getUTCFullYear() !== Number(match[1]) ||
        date.getUTCMonth() !== Number(match[2]) - 1 ||
        date.getUTCDate() !== Number(match[3])) {
        throw new parental_service_1.ParentalApiError('date is invalid', 400);
    }
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (date.getTime() > today.getTime()) {
        throw new parental_service_1.ParentalApiError('journal_date cannot be in the future', 400);
    }
    return date;
}
function endOfDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}
function parentalPeriod(academicYearStart) {
    const year = academicYearStart.getUTCFullYear();
    return {
        start: new Date(Date.UTC(year, 8, 1)),
        end: endOfDay(new Date(Date.UTC(year + 1, 5, 15))),
    };
}
async function guardianForUser(userId) {
    const guardian = await client_2.default.guardians.findFirst({
        where: { user_id: userId, status: 'active' },
    });
    if (!guardian)
        throw new parental_service_1.ParentalApiError('Active guardian profile not found', 403);
    return guardian;
}
async function accessibleChild(guardianId, studentId) {
    const link = await client_2.default.student_guardians.findFirst({
        where: {
            guardian_id: guardianId,
            student_id: studentId,
            status: 'active',
            validated_at: { not: null },
            can_view_journal: true,
        },
        include: { students: true },
    });
    if (!link)
        throw new parental_service_1.ParentalApiError('Child is not accessible to this Parent account', 403);
    return link;
}
async function effectiveEnrollment(studentId, journalDate) {
    const enrollments = await client_2.default.student_enrollments.findMany({
        where: {
            student_id: studentId,
            academic_year_classes: {
                academic_years: {
                    start_date: { lte: journalDate },
                    end_date: { gte: journalDate },
                },
            },
        },
        include: {
            academic_year_classes: {
                include: { academic_years: true, school_classes: true },
            },
        },
    });
    const dateEnd = endOfDay(journalDate);
    const enrollment = enrollments.find((candidate) => {
        const period = parentalPeriod(candidate.academic_year_classes.academic_years.start_date);
        const started = candidate.parental_tracking_started_at;
        const ended = candidate.parental_tracking_ended_at;
        return (journalDate.getTime() >= period.start.getTime() &&
            journalDate.getTime() <= period.end.getTime() &&
            started !== null &&
            started.getTime() <= dateEnd.getTime() &&
            (ended === null || ended.getTime() > journalDate.getTime()));
    });
    if (!enrollment) {
        throw new parental_service_1.ParentalApiError('Parental tracking was not effective for this child on this date', 409);
    }
    return enrollment;
}
const lessonInclude = {
    users: {
        select: { id: true, first_name: true, last_name: true },
    },
    teacher_assignments: {
        include: {
            academic_year_subjects: {
                include: { subjects: true },
            },
        },
    },
    lesson_validations: {
        orderBy: { validated_at: 'desc' },
        select: { decision: true, validated_at: true },
    },
};
async function dailyLessons(academicYearClassId, journalDate) {
    return client_2.default.lesson_sessions.findMany({
        where: {
            actual_date: journalDate,
            teacher_assignments: {
                academic_year_subjects: { academic_year_class_id: academicYearClassId },
            },
            lesson_validations: { some: { decision: 'validated' } },
        },
        include: lessonInclude,
        orderBy: [{ actual_start_time: 'asc' }, { id: 'asc' }],
    });
}
function lessonView(lesson) {
    const subject = lesson.teacher_assignments.academic_year_subjects.subjects;
    const validation = lesson.lesson_validations[0];
    return {
        lesson_session_id: lesson.id.toString(),
        subject: subject.name,
        teacher: {
            id: lesson.users.id.toString(),
            first_name: lesson.users.first_name,
            last_name: lesson.users.last_name,
        },
        summary: lesson.lesson_summary,
        homework: lesson.homework_given,
        observations: lesson.observations,
        validation_status: validation?.decision ?? lesson.lesson_status,
        start_time: lesson.actual_start_time,
        end_time: lesson.actual_end_time,
    };
}
async function getOwnChildren(userIdValue) {
    const userId = parseId(userIdValue, 'userId');
    const guardian = await guardianForUser(userId);
    const links = await client_2.default.student_guardians.findMany({
        where: {
            guardian_id: guardian.id,
            status: 'active',
            validated_at: { not: null },
            can_view_journal: true,
        },
        include: {
            students: {
                include: {
                    student_enrollments: {
                        include: {
                            academic_year_classes: {
                                include: { academic_years: true, school_classes: true },
                            },
                        },
                        orderBy: { created_at: 'desc' },
                    },
                },
            },
        },
        orderBy: { created_at: 'asc' },
    });
    return {
        guardian_id: guardian.id,
        children: links.map((link) => ({
            relationship_type: link.relationship_type,
            is_primary: link.is_primary,
            student: {
                ...link.students,
                student_enrollments: link.students.student_enrollments.map((enrollment) => ({
                    ...enrollment,
                    tracking_status: (0, parental_student_service_1.enrollmentTrackingStatus)(enrollment),
                })),
            },
        })),
    };
}
async function getOwnChildJournals(userIdValue, studentIdValue, dateValue) {
    const userId = parseId(userIdValue, 'userId');
    const studentId = parseId(studentIdValue, 'studentId');
    const journalDate = parseDate(dateValue);
    const guardian = await guardianForUser(userId);
    const link = await accessibleChild(guardian.id, studentId);
    const enrollment = await effectiveEnrollment(studentId, journalDate);
    const lessons = await dailyLessons(enrollment.academic_year_class_id, journalDate);
    const acknowledgement = await client_2.default.parent_daily_acknowledgements.findUnique({
        where: {
            guardian_id_student_id_journal_date: {
                guardian_id: guardian.id,
                student_id: studentId,
                journal_date: journalDate,
            },
        },
    });
    await client_2.default.activity_logs.create({
        data: {
            school_id: guardian.school_id,
            user_id: userId,
            activity_type: 'parent_daily_journal_viewed',
            module_name: 'parental_tracking',
            reference_table: 'students',
            reference_id: studentId,
            title: 'Consultation du journal quotidien',
            description: `Le journal du ${journalDate.toISOString().slice(0, 10)} a ete consulte.`,
        },
    });
    return {
        student: link.students,
        journal_date: journalDate,
        lessons: lessons.map(lessonView),
        acknowledgement,
    };
}
async function acknowledgeOwnChildJournal(userIdValue, studentIdValue, dateValue, metadata) {
    const userId = parseId(userIdValue, 'userId');
    const studentId = parseId(studentIdValue, 'studentId');
    const journalDate = parseDate(dateValue);
    const guardian = await guardianForUser(userId);
    await accessibleChild(guardian.id, studentId);
    const enrollment = await effectiveEnrollment(studentId, journalDate);
    const lessons = await dailyLessons(enrollment.academic_year_class_id, journalDate);
    if (!lessons.length)
        throw new parental_service_1.ParentalApiError('No validated or published lessons exist for this date', 409);
    const snapshot = lessons.map(lessonView);
    const comment = metadata.comment === undefined || metadata.comment === null
        ? null
        : typeof metadata.comment === 'string'
            ? metadata.comment.trim() || null
            : (() => {
                throw new parental_service_1.ParentalApiError('comment must be a string', 400);
            })();
    try {
        return await client_2.default.$transaction(async (transaction) => {
            const acknowledgement = await transaction.parent_daily_acknowledgements.create({
                data: {
                    guardian_id: guardian.id,
                    student_id: studentId,
                    academic_year_class_id: enrollment.academic_year_class_id,
                    journal_date: journalDate,
                    lesson_count_snapshot: snapshot.length,
                    journal_snapshot: snapshot,
                    ip_address: metadata.ipAddress,
                    user_agent: metadata.userAgent,
                    comment,
                },
            });
            await transaction.activity_logs.create({
                data: {
                    school_id: guardian.school_id,
                    user_id: userId,
                    activity_type: 'parent_daily_journal_acknowledged',
                    module_name: 'parental_tracking',
                    reference_table: 'parent_daily_acknowledgements',
                    reference_id: acknowledgement.id,
                    title: 'Visa du journal quotidien',
                    description: `Le parent a vise ${snapshot.length} cours pour le ${journalDate.toISOString().slice(0, 10)}.`,
                },
            });
            return acknowledgement;
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new parental_service_1.ParentalApiError('This daily journal has already been acknowledged', 409);
        }
        throw error;
    }
}
async function getOwnNotifications(userIdValue, input) {
    const userId = parseId(userIdValue, 'userId');
    await guardianForUser(userId);
    const page = input.page ? Number(input.page) : 1;
    const limit = input.limit ? Number(input.limit) : 20;
    if (!Number.isInteger(page) || page <= 0)
        throw new parental_service_1.ParentalApiError('page must be positive', 400);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
        throw new parental_service_1.ParentalApiError('limit must be between 1 and 100', 400);
    }
    let unread;
    if (input.unread === 'true')
        unread = true;
    else if (input.unread === 'false' || input.unread === undefined)
        unread = undefined;
    else
        throw new parental_service_1.ParentalApiError('unread must be true or false', 400);
    const where = {
        recipient_user_id: userId,
        ...(unread ? { is_read: false } : {}),
    };
    const [notifications, total] = await client_2.default.$transaction([
        client_2.default.notifications.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        client_2.default.notifications.count({ where }),
    ]);
    return {
        notifications,
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    };
}
