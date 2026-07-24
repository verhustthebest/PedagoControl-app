import type { AuthUser } from './auth.service'
import prisma from '../prisma/client'
import { isSuperAdmin } from '../security/access-policy'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { deliverNotification } from './notification-delivery.service'

const PREFET_ROLES = ['PREFET', 'PREFET_DES_ETUDES', 'DIRECTEUR_ETUDES', 'DIRECTEUR_DES_ETUDES']
const PROMOTER_ROLES = ['PROMOTEUR', 'ADMIN_GESTIONNAIRE', 'SUPER_ADMIN']
const DECISIONS = ['validated', 'correction_requested'] as const

type LessonDecision = typeof DECISIONS[number]

type CreateLessonReportInput = {
  program_distribution_id: string
  teacher_assignment_id: string
  actual_date?: string
  actual_start_time?: string
  actual_end_time?: string
  actual_periods?: number
  lesson_summary: string
  objectives_achieved?: string
  exercises_given?: string
  homework_given?: string
  observations?: string
}

type DecideLessonReportInput = {
  decision: string
  observation?: string
}

function toBigInt(value: string | number | bigint) {
  return typeof value === 'bigint' ? value : BigInt(value)
}

function toDateOnly(value?: string) {
  const date = value ? new Date(value) : new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function toTime(value?: string) {
  if (!value) return undefined

  return new Date(`1970-01-01T${value}`)
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}

function reportSecret() {
  return process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'development-only-pedago-control-public-resource-secret'
}

/** Les tables historiques sans public_id sont référencées par un jeton signé, jamais par leur clé numérique. */
function opaqueId(kind: string, schoolId: string, id: bigint) {
  const payload = `${kind}.${schoolId}.${id.toString()}`
  const signature = createHmac('sha256', reportSecret()).update(payload).digest('base64url')
  return Buffer.from(`${payload}.${signature}`).toString('base64url')
}

function readOpaqueId(value: string, kind: string, schoolId: string) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString()
    const [actualKind, actualSchool, rawId, signature] = decoded.split('.')
    const payload = `${actualKind}.${actualSchool}.${rawId}`
    const expected = createHmac('sha256', reportSecret()).update(payload).digest('base64url')
    if (actualKind !== kind || actualSchool !== schoolId || !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error()
    return BigInt(rawId)
  } catch {
    throw new Error('Resource not found')
  }
}

function todayRange() {
  const start = toDateOnly()
  const end = new Date(start)
  end.setDate(start.getDate() + 1)

  return { start, end }
}

function schoolScope(user: AuthUser) {
  if (user.school_id) return { users: { school_id: toBigInt(user.school_id) } }
  if (isSuperAdmin(user)) return {}
  throw new Error('Access forbidden')
}

async function findRecipients(roleNames: string[], schoolId: string | null, excludeUserId?: string) {
  return prisma.users.findMany({
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
  })
}

async function createNotifications(params: {
  recipients: Array<{ id: bigint }>
  senderId: bigint
  title: string
  message: string
  notificationType: string
  referenceId: bigint
}) {
  if (!params.recipients.length) return

  await prisma.notifications.createMany({
    data: params.recipients.map((recipient) => ({
      recipient_user_id: recipient.id,
      sender_user_id: params.senderId,
      title: params.title,
      message: params.message,
      notification_type: params.notificationType,
      reference_table: 'lesson_sessions',
      reference_id: params.referenceId,
    })),
  })
}

function reportNotificationContext(report: {
  actual_date: Date
  users?: { first_name: string; last_name: string; email: string }
  teacher_assignments?: {
    academic_year_subjects?: {
      subjects?: { name: string }
      academic_year_classes?: { school_classes?: { name: string; parallel: string | null } }
    }
  }
}) {
  const rawTeacher = [report.users?.first_name, report.users?.last_name].filter(Boolean).join(' ')
  const teacher = rawTeacher === 'Enseignant Demo' ? report.users?.email || 'Enseignant' : rawTeacher || report.users?.email || 'Enseignant'
  const schoolClass = report.teacher_assignments?.academic_year_subjects?.academic_year_classes?.school_classes
  const className = [schoolClass?.name, schoolClass?.parallel].filter(Boolean).join(' ') || 'Classe'
  const subject = report.teacher_assignments?.academic_year_subjects?.subjects?.name || 'Matiere'
  const date = report.actual_date.toISOString().slice(0, 10)
  return `${teacher} - ${className} - ${subject} - ${date}`
}

async function createActivityLog(params: {
  schoolId: string | null
  userId: bigint
  activityType: string
  title: string
  description: string
  referenceId: bigint
}) {
  if (!params.schoolId) return

  await prisma.activity_logs.create({
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
  })
}

async function parentRecipientsForReport(report: any, schoolId: string) {
  const yearClassId = report.teacher_assignments.academic_year_subjects.academic_year_class_id
  return prisma.guardians.findMany({
    where: {
      school_id: toBigInt(schoolId), status: 'active', user_id: { not: null },
      student_guardians: { some: {
        status: 'active', can_view_journal: true, validated_at: { not: null },
        students: { student_enrollments: { some: { academic_year_class_id: yearClassId, parental_tracking_enabled: true } } },
      } },
    },
    select: { user_id: true, email: true, phone: true },
  })
}

/** Publie la disponibilité sans transformer PREPARED ou SIMULATED en faux succès fournisseur. */
async function notifyParentsJournalAvailable(report: any, schoolId: string, senderId: bigint, correction = false) {
  const guardians = await parentRecipientsForReport(report, schoolId)
  const date = report.actual_date.toISOString().slice(0, 10)
  const title = correction ? 'Correction du journal renvoyée' : 'Journal quotidien disponible'
  const message = correction
    ? `Une correction du journal du ${date} a été renvoyée et reste disponible.`
    : `Le journal envoyé par l'Enseignant pour le ${date} est disponible, en attente de contrôle.`
  await createNotifications({
    recipients: guardians.flatMap((guardian) => guardian.user_id ? [{ id: guardian.user_id }] : []),
    senderId, title, message,
    notificationType: correction ? 'parent_daily_journal_correction_resubmitted' : 'parent_daily_journal_available',
    referenceId: report.id,
  })
  await Promise.allSettled(guardians.flatMap((guardian) => [
    ...(guardian.email ? [deliverNotification({ channel: 'email' as const, to: guardian.email, subject: title, text: `PEDAGO CONTROL : ${message}` })] : []),
    ...(guardian.phone ? [deliverNotification({ channel: 'sms' as const, to: guardian.phone, text: `PEDAGO CONTROL : ${message}` })] : []),
  ]))
}

const reportInclude = {
  users: {
    select: {
      id: true,
      public_id: true,
      first_name: true,
      last_name: true,
      email: true,
      school_id: true,
    },
  },
  teacher_assignments: {
    include: {
      academic_year_subjects: {
        include: {
          subjects: true,
          academic_year_classes: {
            include: {
              school_classes: true,
            },
          },
        },
      },
    },
  },
  program_distribution: {
    include: {
      program_chapters: true,
      program_sub_chapters: true,
      annual_programs: true,
    },
  },
  lesson_validations: true,
  lesson_comments: true,
}

function publicReport(report: any, schoolId: string) {
  const assignment = report.teacher_assignments
  const annualSubject = assignment?.academic_year_subjects
  const subject = annualSubject?.subjects
  const distribution = report.program_distribution
  return serialize({
    public_id: opaqueId('report', schoolId, report.id),
    assignment_public_id: opaqueId('assignment', schoolId, report.teacher_assignment_id),
    distribution_public_id: opaqueId('distribution', schoolId, report.program_distribution_id),
    actual_date: report.actual_date,
    actual_start_time: report.actual_start_time,
    actual_end_time: report.actual_end_time,
    actual_periods: report.actual_periods,
    lesson_status: report.lesson_status,
    lesson_summary: report.lesson_summary,
    objectives_achieved: report.objectives_achieved,
    exercises_given: report.exercises_given,
    homework_given: report.homework_given,
    observations: report.observations,
    submitted_at: report.submitted_at,
    teacher: report.users ? { public_id: report.users.public_id, first_name: report.users.first_name, last_name: report.users.last_name } : null,
    assignment: annualSubject ? {
      subject: { public_id: opaqueId('subject', schoolId, subject.id), name: subject.name },
      class: {
        public_id: annualSubject.academic_year_classes.school_classes.public_id,
        name: annualSubject.academic_year_classes.school_classes.name,
        parallel: annualSubject.academic_year_classes.school_classes.parallel,
      },
    } : null,
    program: distribution ? {
      title: distribution.annual_programs.title,
      chapter: distribution.program_chapters.title,
      sub_chapter: distribution.program_sub_chapters?.title || null,
    } : null,
    validations: (report.lesson_validations || []).map((item: any) => ({ decision: item.decision, observation: item.validation_comment, decided_at: item.validated_at })),
  })
}

export function isLessonDecision(decision: string): decision is LessonDecision {
  return DECISIONS.includes(decision as LessonDecision)
}

export async function getTeacherAssignments(user: AuthUser) {
  if (!user.school_id) throw new Error('Access forbidden')
  const assignments = await prisma.teacher_assignments.findMany({
    where: {
      teacher_user_id: toBigInt(user.id), status: 'active',
      academic_year_subjects: { is_active: true, academic_year_classes: { is_active: true, academic_years: { school_id: toBigInt(user.school_id), is_active: true } } },
    },
    select: {
      id: true,
      academic_year_subjects: {
        select: {
          subjects: { select: { id: true, name: true, code: true } },
          academic_year_classes: { select: { public_id: true, school_classes: { select: { public_id: true, name: true, parallel: true } } } },
          annual_programs: {
            where: { status: { in: ['validated', 'active', 'sent'] } },
            select: { title: true, program_distribution: { select: { id: true, planned_date: true, program_chapters: { select: { title: true } }, program_sub_chapters: { select: { title: true } } }, orderBy: { planned_date: 'asc' } } },
          },
        },
      },
    },
  })
  return assignments.flatMap((assignment) => {
    const subject = assignment.academic_year_subjects.subjects
    const annualClass = assignment.academic_year_subjects.academic_year_classes
    return assignment.academic_year_subjects.annual_programs.flatMap((program) =>
      program.program_distribution.map((distribution) => ({
        public_id: opaqueId('assignment', user.school_id!, assignment.id),
        distribution_public_id: opaqueId('distribution', user.school_id!, distribution.id),
        class: { public_id: annualClass.school_classes.public_id, annual_public_id: annualClass.public_id, name: annualClass.school_classes.name, parallel: annualClass.school_classes.parallel },
        subject: { public_id: opaqueId('subject', user.school_id!, subject.id), name: subject.name, code: subject.code },
        program: program.title,
        chapter: distribution.program_chapters.title,
        sub_chapter: distribution.program_sub_chapters?.title || null,
        planned_date: distribution.planned_date,
      })),
    )
  })
}

export async function getTeacherReportsToday(user: AuthUser) {
  const { start, end } = todayRange()
  const reports = await prisma.lesson_sessions.findMany({
    where: { teacher_user_id: toBigInt(user.id), actual_date: { gte: start, lt: end } },
    include: reportInclude,
    orderBy: { submitted_at: 'desc' },
  })
  if (!user.school_id) throw new Error('Access forbidden')
  return reports.map((report) => publicReport(report, user.school_id!))
}

export async function getTeacherReports(user: AuthUser) {
  const reports = await prisma.lesson_sessions.findMany({
    where: {
      teacher_user_id: toBigInt(user.id),
    },
    include: reportInclude,
    orderBy: { submitted_at: 'desc' },
  })

  if (!user.school_id) throw new Error('Access forbidden')
  return reports.map((report) => publicReport(report, user.school_id!))
}

export async function createTeacherReport(user: AuthUser, input: CreateLessonReportInput) {
  if (!input.program_distribution_id || !input.teacher_assignment_id || !input.lesson_summary) {
    throw new Error('program_distribution_id, teacher_assignment_id and lesson_summary are required')
  }

  if (!user.school_id) throw new Error('Access forbidden')
  const teacherAssignmentId = readOpaqueId(input.teacher_assignment_id, 'assignment', user.school_id)
  const programDistributionId = readOpaqueId(input.program_distribution_id, 'distribution', user.school_id)
  const teacherUserId = toBigInt(user.id)

  const assignment = await prisma.teacher_assignments.findFirst({
    where: {
      id: teacherAssignmentId,
      teacher_user_id: teacherUserId,
      status: 'active',
    },
  })

  if (!assignment) {
    throw new Error('Active teacher assignment not found for current user')
  }

  const distribution = await prisma.program_distribution.findFirst({
    where: {
      id: programDistributionId,
      annual_programs: {
        academic_year_subject_id: assignment.academic_year_subject_id,
      },
    },
  })

  if (!distribution) {
    throw new Error('Program distribution not found for this teacher assignment')
  }

  const actualDate = toDateOnly(input.actual_date)
  if (actualDate.getTime() > toDateOnly().getTime()) throw new Error('Future dates are not allowed')
  const report = await prisma.lesson_sessions.create({
    data: {
      program_distribution_id: programDistributionId,
      teacher_assignment_id: teacherAssignmentId,
      teacher_user_id: teacherUserId,
      actual_date: actualDate,
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
  })

  await createActivityLog({
    schoolId: user.school_id,
    userId: teacherUserId,
    activityType: 'lesson_report_submitted',
    title: 'Rapport quotidien soumis',
    description: `Rapport ${report.id.toString()} soumis par ${user.email}`,
    referenceId: report.id,
  })

  const [prefets, promoters] = await Promise.all([
    findRecipients(PREFET_ROLES, user.school_id, user.id),
    findRecipients(PROMOTER_ROLES, user.school_id, user.id),
  ])

  await Promise.all([
    createNotifications({
      recipients: prefets,
      senderId: teacherUserId,
      title: 'Nouveau rapport quotidien',
      message: reportNotificationContext(report),
      notificationType: 'lesson_report_submitted',
      referenceId: report.id,
    }),
    createNotifications({
      recipients: promoters,
      senderId: teacherUserId,
      title: 'Supervision silencieuse',
      message: reportNotificationContext(report),
      notificationType: 'silent_supervision_report_submitted',
      referenceId: report.id,
    }),
  ])
  await notifyParentsJournalAvailable(report, user.school_id, teacherUserId)

  /*
  if (input.decision === 'validated') {
    const yearClassId = report.teacher_assignments.academic_year_subjects.academic_year_class_id
    const guardians = await prisma.guardians.findMany({
      where: {
        school_id: toBigInt(user.school_id),
        status: 'active',
        user_id: { not: null },
        student_guardians: {
          some: {
            status: 'approved', can_view_journal: true,
            students: { student_enrollments: { some: { academic_year_class_id: yearClassId, parental_tracking_enabled: true } } },
          },
        },
      },
      select: { user_id: true, email: true, phone: true },
    })
    await createNotifications({
      recipients: guardians.flatMap((guardian) => guardian.user_id ? [{ id: guardian.user_id }] : []),
      senderId: prefectUserId,
      title: 'Journal quotidien disponible',
      message: `Les leçons validées du ${report.actual_date.toISOString().slice(0, 10)} sont disponibles.`,
      notificationType: 'parent_daily_journal_available',
      referenceId: report.id,
    })
    const deliveryText = `PEDAGO CONTROL : le journal validé du ${report.actual_date.toISOString().slice(0, 10)} est disponible dans votre portail Parent.`
    await Promise.allSettled(guardians.flatMap((guardian) => [
      ...(guardian.email ? [deliverNotification({ channel: 'email' as const, to: guardian.email, subject: 'Journal quotidien disponible', text: deliveryText })] : []),
      ...(guardian.phone ? [deliverNotification({ channel: 'sms' as const, to: guardian.phone, text: deliveryText })] : []),
    ]))
  }

  const teacher = await prisma.users.findUnique({ where: { id: report.teacher_user_id }, select: { email: true, phone: true } })
  const teacherText = `PEDAGO CONTROL : votre journal du ${report.actual_date.toISOString().slice(0, 10)} a été ${input.decision === 'validated' ? 'validé' : 'retourné pour correction'}.`
  await Promise.allSettled([
    ...(teacher?.email ? [deliverNotification({ channel: 'email' as const, to: teacher.email, subject: 'Décision sur votre journal', text: teacherText })] : []),
    ...(teacher?.phone ? [deliverNotification({ channel: 'sms' as const, to: teacher.phone, text: teacherText })] : []),
  ])
  */

  return publicReport(report, user.school_id)
}

export async function updateTeacherReport(user: AuthUser, reportPublicId: string, input: CreateLessonReportInput) {
  if (!user.school_id) throw new Error('Access forbidden')
  const reportId = readOpaqueId(reportPublicId, 'report', user.school_id)
  const existing = await prisma.lesson_sessions.findFirst({ where: { id: reportId, teacher_user_id: toBigInt(user.id), lesson_status: 'correction_requested' } })
  if (!existing) throw new Error('Report not found')
  const assignmentId = readOpaqueId(input.teacher_assignment_id, 'assignment', user.school_id)
  const distributionId = readOpaqueId(input.program_distribution_id, 'distribution', user.school_id)
  const assignment = await prisma.teacher_assignments.findFirst({ where: { id: assignmentId, teacher_user_id: toBigInt(user.id), status: 'active', academic_year_subject_id: { equals: (await prisma.program_distribution.findFirst({ where: { id: distributionId }, select: { annual_programs: { select: { academic_year_subject_id: true } } } }))?.annual_programs.academic_year_subject_id } } })
  if (!assignment) throw new Error('Active teacher assignment not found for current user')
  const actualDate = toDateOnly(input.actual_date)
  if (actualDate.getTime() > toDateOnly().getTime()) throw new Error('Future dates are not allowed')
  const report = await prisma.lesson_sessions.update({ where: { id: reportId }, data: { teacher_assignment_id: assignmentId, program_distribution_id: distributionId, actual_date: actualDate, actual_periods: input.actual_periods ?? 1, lesson_summary: input.lesson_summary, objectives_achieved: input.objectives_achieved, exercises_given: input.exercises_given, homework_given: input.homework_given, observations: input.observations, lesson_status: 'submitted', submitted_at: new Date() }, include: reportInclude })
  await notifyParentsJournalAvailable(report, user.school_id, toBigInt(user.id), true)
  const prefets = await findRecipients(PREFET_ROLES, user.school_id, user.id)
  await createNotifications({ recipients: prefets, senderId: toBigInt(user.id), title: 'Journal corrigé renvoyé', message: reportNotificationContext(report), notificationType: 'lesson_report_resubmitted', referenceId: report.id })
  return publicReport(report, user.school_id)
}

type ReportFilters = { date?: string; class_id?: string; teacher_id?: string; subject_id?: string; status?: string }

export async function getPendingReports(user: AuthUser, filters: ReportFilters = {}) {
  if (!user.school_id) throw new Error('Access forbidden')
  const where: Prisma.lesson_sessionsWhereInput = {
    ...schoolScope(user),
    ...(filters.status ? { lesson_status: filters.status } : {}),
    ...(filters.date ? { actual_date: toDateOnly(filters.date) } : {}),
    ...(filters.teacher_id ? { users: { public_id: filters.teacher_id, school_id: toBigInt(user.school_id) } } : {}),
    ...(filters.class_id || filters.subject_id ? { teacher_assignments: { academic_year_subjects: {
      ...(filters.subject_id ? { subjects: { id: readOpaqueId(filters.subject_id, 'subject', user.school_id) } } : {}),
      ...(filters.class_id ? { academic_year_classes: { school_classes: { public_id: filters.class_id } } } : {}),
    } } } : {}),
  }
  const reports = await prisma.lesson_sessions.findMany({
    where,
    include: reportInclude,
    orderBy: { submitted_at: 'desc' },
  })

  return reports.map((report) => publicReport(report, user.school_id!))
}

export async function decideReport(user: AuthUser, reportId: string, input: DecideLessonReportInput) {
  if (!isLessonDecision(input.decision)) {
    throw new Error('decision must be one of: validated, rejected, correction_requested')
  }

  const prefectUserId = toBigInt(user.id)
  if (!user.school_id) throw new Error('Access forbidden')
  const lessonSessionId = readOpaqueId(reportId, 'report', user.school_id)

  const existingReport = await prisma.lesson_sessions.findFirst({
    where: {
      id: lessonSessionId,
      ...schoolScope(user),
    },
  })

  if (!existingReport) {
    throw new Error('Report not found')
  }

  const report = await prisma.$transaction(async (transaction) => {
    await transaction.lesson_sessions.update({
      where: { id: lessonSessionId },
      data: {
        lesson_status: input.decision,
        updated_at: new Date(),
      },
    })

    await transaction.lesson_validations.create({
      data: {
        lesson_session_id: lessonSessionId,
        prefect_user_id: prefectUserId,
        decision: input.decision,
        validation_comment: input.observation,
      },
    })

    if (input.observation) {
      await transaction.lesson_comments.create({
        data: {
          lesson_session_id: lessonSessionId,
          user_id: prefectUserId,
          comment_type: 'observation',
          comment_text: input.observation,
        },
      })
    }

    return transaction.lesson_sessions.findUniqueOrThrow({
      where: { id: lessonSessionId },
      include: reportInclude,
    })
  })

  await createActivityLog({
    schoolId: user.school_id,
    userId: prefectUserId,
    activityType: `lesson_report_${input.decision}`,
    title: 'Decision sur rapport quotidien',
    description: `Decision ${input.decision} appliquee au rapport ${reportId}`,
    referenceId: report.id,
  })

  const promoters = await findRecipients(PROMOTER_ROLES, user.school_id, user.id)

  await Promise.all([
    createNotifications({
      recipients: [{ id: report.teacher_user_id }],
      senderId: prefectUserId,
      title: 'Decision sur votre rapport',
      message: `${input.decision} - ${reportNotificationContext(report)}`,
      notificationType: 'lesson_report_decision',
      referenceId: report.id,
    }),
    createNotifications({
      recipients: promoters,
      senderId: prefectUserId,
      title: 'Supervision silencieuse',
      message: `${input.decision} - ${reportNotificationContext(report)}`,
      notificationType: 'silent_supervision_report_decision',
      referenceId: report.id,
    }),
  ])

  // Les canaux externes réutilisent le transport central : PREPARED/SIMULATED ne sont jamais annoncés comme SENT.
  const teacher = await prisma.users.findUnique({ where: { id: report.teacher_user_id }, select: { email: true, phone: true } })
  const teacherText = `PEDAGO CONTROL : votre journal du ${report.actual_date.toISOString().slice(0, 10)} a été ${input.decision === 'validated' ? 'validé' : 'retourné pour correction'}.`
  await Promise.allSettled([
    ...(teacher?.email ? [deliverNotification({ channel: 'email' as const, to: teacher.email, subject: 'Décision sur votre journal', text: teacherText })] : []),
    ...(teacher?.phone ? [deliverNotification({ channel: 'sms' as const, to: teacher.phone, text: teacherText })] : []),
  ])

  if (input.decision === 'validated') {
    const yearClassId = report.teacher_assignments.academic_year_subjects.academic_year_class_id
    const guardians = await prisma.guardians.findMany({
      where: {
        school_id: toBigInt(user.school_id), status: 'active', user_id: { not: null },
        student_guardians: { some: {
          status: 'active', can_view_journal: true, validated_at: { not: null },
          students: { student_enrollments: { some: { academic_year_class_id: yearClassId, parental_tracking_enabled: true } } },
        } },
      },
      select: { user_id: true, email: true, phone: true },
    })
    await createNotifications({
      recipients: guardians.flatMap((guardian) => guardian.user_id ? [{ id: guardian.user_id }] : []),
      senderId: prefectUserId,
      title: 'Journal quotidien disponible',
      message: `Les leçons validées du ${report.actual_date.toISOString().slice(0, 10)} sont disponibles.`,
      notificationType: 'parent_daily_journal_available',
      referenceId: report.id,
    })
    const parentText = `PEDAGO CONTROL : le journal validé du ${report.actual_date.toISOString().slice(0, 10)} est disponible dans votre portail Parent.`
    await Promise.allSettled(guardians.flatMap((guardian) => [
      ...(guardian.email ? [deliverNotification({ channel: 'email' as const, to: guardian.email, subject: 'Journal quotidien disponible', text: parentText })] : []),
      ...(guardian.phone ? [deliverNotification({ channel: 'sms' as const, to: guardian.phone, text: parentText })] : []),
    ]))
  }

  return publicReport(report, user.school_id)
}

export async function getSupervisionReports(user: AuthUser) {
  const where = schoolScope(user)
  const [submitted, validated, rejected, corrections, latest] = await Promise.all([
    prisma.lesson_sessions.count({ where: { ...where, lesson_status: 'submitted' } }),
    prisma.lesson_sessions.count({ where: { ...where, lesson_status: 'validated' } }),
    prisma.lesson_sessions.count({ where: { ...where, lesson_status: 'rejected' } }),
    prisma.lesson_sessions.count({ where: { ...where, lesson_status: 'correction_requested' } }),
    prisma.lesson_sessions.findMany({
      where,
      include: reportInclude,
      orderBy: { submitted_at: 'desc' },
      take: 10,
    }),
  ])

  return serialize({
    summary: {
      soumis: submitted,
      valides: validated,
      rejetes: rejected,
      corrections: corrections,
    },
    latest_reports: latest,
  })
}
