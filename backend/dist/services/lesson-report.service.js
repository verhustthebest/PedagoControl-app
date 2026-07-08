"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLessonDecision = isLessonDecision;
exports.getTeacherReportsToday = getTeacherReportsToday;
exports.getTeacherReports = getTeacherReports;
exports.createTeacherReport = createTeacherReport;
exports.getPendingReports = getPendingReports;
exports.decideReport = decideReport;
exports.getSupervisionReports = getSupervisionReports;
const client_1 = __importDefault(require("../prisma/client"));
const PREFET_ROLES = ['PREFET', 'PREFET_DES_ETUDES', 'DIRECTEUR_ETUDES', 'DIRECTEUR_DES_ETUDES'];
const PROMOTER_ROLES = ['PROMOTEUR', 'ADMIN_GESTIONNAIRE', 'SUPER_ADMIN'];
const DECISIONS = ['validated', 'rejected', 'correction_requested'];
function toBigInt(value) {
    return typeof value === 'bigint' ? value : BigInt(value);
}
function toDateOnly(value) {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}
function toTime(value) {
    if (!value)
        return undefined;
    return new Date(`1970-01-01T${value}`);
}
function serialize(value) {
    return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)));
}
function todayRange() {
    const start = toDateOnly();
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
}
function schoolScope(user) {
    return user.school_id ? { users: { school_id: toBigInt(user.school_id) } } : {};
}
async function findRecipients(roleNames, schoolId, excludeUserId) {
    return client_1.default.users.findMany({
        where: {
            is_active: true,
            ...(schoolId ? { OR: [{ school_id: toBigInt(schoolId) }, { school_id: null }] } : {}),
            ...(excludeUserId ? { id: { not: toBigInt(excludeUserId) } } : {}),
            user_roles: {
                some: {
                    roles: {
                        name: { in: roleNames },
                    },
                },
            },
        },
        select: { id: true },
    });
}
async function createNotifications(params) {
    if (!params.recipients.length)
        return;
    await client_1.default.notifications.createMany({
        data: params.recipients.map((recipient) => ({
            recipient_user_id: recipient.id,
            sender_user_id: params.senderId,
            title: params.title,
            message: params.message,
            notification_type: params.notificationType,
            reference_table: 'lesson_sessions',
            reference_id: params.referenceId,
        })),
    });
}
async function createActivityLog(params) {
    if (!params.schoolId)
        return;
    await client_1.default.activity_logs.create({
        data: {
            school_id: toBigInt(params.schoolId),
            user_id: params.userId,
            activity_type: params.activityType,
            module_name: 'lesson_reports',
            reference_table: 'lesson_sessions',
            reference_id: params.referenceId,
            title: params.title,
            description: params.description,
        },
    });
}
const reportInclude = {
    users: {
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            school_id: true,
        },
    },
    teacher_assignments: true,
    program_distribution: {
        include: {
            program_chapters: true,
            program_sub_chapters: true,
            annual_programs: true,
        },
    },
    lesson_validations: true,
    lesson_comments: true,
};
function isLessonDecision(decision) {
    return DECISIONS.includes(decision);
}
async function getTeacherReportsToday(user) {
    const { start, end } = todayRange();
    const reports = await client_1.default.lesson_sessions.findMany({
        where: {
            teacher_user_id: toBigInt(user.id),
            actual_date: {
                gte: start,
                lt: end,
            },
        },
        include: reportInclude,
        orderBy: { submitted_at: 'desc' },
    });
    return serialize(reports);
}
async function getTeacherReports(user) {
    const reports = await client_1.default.lesson_sessions.findMany({
        where: {
            teacher_user_id: toBigInt(user.id),
        },
        include: reportInclude,
        orderBy: { submitted_at: 'desc' },
    });
    return serialize(reports);
}
async function createTeacherReport(user, input) {
    if (!input.program_distribution_id || !input.teacher_assignment_id || !input.lesson_summary) {
        throw new Error('program_distribution_id, teacher_assignment_id and lesson_summary are required');
    }
    const teacherAssignmentId = toBigInt(input.teacher_assignment_id);
    const programDistributionId = toBigInt(input.program_distribution_id);
    const teacherUserId = toBigInt(user.id);
    const assignment = await client_1.default.teacher_assignments.findFirst({
        where: {
            id: teacherAssignmentId,
            teacher_user_id: teacherUserId,
            status: 'active',
        },
    });
    if (!assignment) {
        throw new Error('Active teacher assignment not found for current user');
    }
    const distribution = await client_1.default.program_distribution.findFirst({
        where: {
            id: programDistributionId,
            annual_programs: {
                academic_year_subject_id: assignment.academic_year_subject_id,
            },
        },
    });
    if (!distribution) {
        throw new Error('Program distribution not found for this teacher assignment');
    }
    const report = await client_1.default.lesson_sessions.create({
        data: {
            program_distribution_id: programDistributionId,
            teacher_assignment_id: teacherAssignmentId,
            teacher_user_id: teacherUserId,
            actual_date: toDateOnly(input.actual_date),
            actual_start_time: toTime(input.actual_start_time),
            actual_end_time: toTime(input.actual_end_time),
            actual_periods: input.actual_periods ?? 1,
            lesson_status: 'submitted',
            lesson_summary: input.lesson_summary,
            objectives_achieved: input.objectives_achieved,
            exercises_given: input.exercises_given,
            homework_given: input.homework_given,
            observations: input.observations,
        },
        include: reportInclude,
    });
    await createActivityLog({
        schoolId: user.school_id,
        userId: teacherUserId,
        activityType: 'lesson_report_submitted',
        title: 'Rapport quotidien soumis',
        description: `Rapport ${report.id.toString()} soumis par ${user.email}`,
        referenceId: report.id,
    });
    const [prefets, promoters] = await Promise.all([
        findRecipients(PREFET_ROLES, user.school_id, user.id),
        findRecipients(PROMOTER_ROLES, user.school_id, user.id),
    ]);
    await Promise.all([
        createNotifications({
            recipients: prefets,
            senderId: teacherUserId,
            title: 'Nouveau rapport quotidien',
            message: `Un rapport de cours a ete soumis par ${user.first_name} ${user.last_name}.`,
            notificationType: 'lesson_report_submitted',
            referenceId: report.id,
        }),
        createNotifications({
            recipients: promoters,
            senderId: teacherUserId,
            title: 'Supervision silencieuse',
            message: `Rapport quotidien soumis par ${user.first_name} ${user.last_name}.`,
            notificationType: 'silent_supervision_report_submitted',
            referenceId: report.id,
        }),
    ]);
    return serialize(report);
}
async function getPendingReports(user) {
    const reports = await client_1.default.lesson_sessions.findMany({
        where: {
            lesson_status: 'submitted',
            ...schoolScope(user),
        },
        include: reportInclude,
        orderBy: { submitted_at: 'desc' },
    });
    return serialize(reports);
}
async function decideReport(user, reportId, input) {
    if (!isLessonDecision(input.decision)) {
        throw new Error('decision must be one of: validated, rejected, correction_requested');
    }
    const prefectUserId = toBigInt(user.id);
    const lessonSessionId = toBigInt(reportId);
    const existingReport = await client_1.default.lesson_sessions.findFirst({
        where: {
            id: lessonSessionId,
            ...schoolScope(user),
        },
    });
    if (!existingReport) {
        throw new Error('Report not found');
    }
    const report = await client_1.default.$transaction(async (transaction) => {
        await transaction.lesson_sessions.update({
            where: { id: lessonSessionId },
            data: {
                lesson_status: input.decision,
                updated_at: new Date(),
            },
        });
        await transaction.lesson_validations.create({
            data: {
                lesson_session_id: lessonSessionId,
                prefect_user_id: prefectUserId,
                decision: input.decision,
                validation_comment: input.observation,
            },
        });
        if (input.observation) {
            await transaction.lesson_comments.create({
                data: {
                    lesson_session_id: lessonSessionId,
                    user_id: prefectUserId,
                    comment_type: 'observation',
                    comment_text: input.observation,
                },
            });
        }
        return transaction.lesson_sessions.findUniqueOrThrow({
            where: { id: lessonSessionId },
            include: reportInclude,
        });
    });
    await createActivityLog({
        schoolId: user.school_id,
        userId: prefectUserId,
        activityType: `lesson_report_${input.decision}`,
        title: 'Decision sur rapport quotidien',
        description: `Decision ${input.decision} appliquee au rapport ${reportId}`,
        referenceId: report.id,
    });
    const promoters = await findRecipients(PROMOTER_ROLES, user.school_id, user.id);
    await Promise.all([
        createNotifications({
            recipients: [{ id: report.teacher_user_id }],
            senderId: prefectUserId,
            title: 'Decision sur votre rapport',
            message: `Votre rapport quotidien est marque: ${input.decision}.`,
            notificationType: 'lesson_report_decision',
            referenceId: report.id,
        }),
        createNotifications({
            recipients: promoters,
            senderId: prefectUserId,
            title: 'Supervision silencieuse',
            message: `Decision ${input.decision} sur un rapport quotidien.`,
            notificationType: 'silent_supervision_report_decision',
            referenceId: report.id,
        }),
    ]);
    return serialize(report);
}
async function getSupervisionReports(user) {
    const where = schoolScope(user);
    const [submitted, validated, rejected, corrections, latest] = await Promise.all([
        client_1.default.lesson_sessions.count({ where: { ...where, lesson_status: 'submitted' } }),
        client_1.default.lesson_sessions.count({ where: { ...where, lesson_status: 'validated' } }),
        client_1.default.lesson_sessions.count({ where: { ...where, lesson_status: 'rejected' } }),
        client_1.default.lesson_sessions.count({ where: { ...where, lesson_status: 'correction_requested' } }),
        client_1.default.lesson_sessions.findMany({
            where,
            include: reportInclude,
            orderBy: { submitted_at: 'desc' },
            take: 10,
        }),
    ]);
    return serialize({
        summary: {
            soumis: submitted,
            valides: validated,
            rejetes: rejected,
            corrections: corrections,
        },
        latest_reports: latest,
    });
}
