import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'
import { ParentalApiError } from './parental.service'
import { enrollmentTrackingStatus } from './parental-student.service'

function parseId(value: string, field: string) {
  try {
    const id = BigInt(value)
    if (id <= 0n) throw new Error()
    return id
  } catch {
    throw new ParentalApiError(`${field} must be a valid positive id`, 400)
  }
}

function parseDate(value: unknown) {
  if (typeof value !== 'string') throw new ParentalApiError('date must use YYYY-MM-DD', 400)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new ParentalApiError('date must use YYYY-MM-DD', 400)
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new ParentalApiError('date is invalid', 400)
  }
  return date
}

function endOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
}

function parentalPeriod(academicYearStart: Date) {
  const year = academicYearStart.getUTCFullYear()
  return {
    start: new Date(Date.UTC(year, 8, 1)),
    end: endOfDay(new Date(Date.UTC(year + 1, 5, 15))),
  }
}

async function guardianForUser(userId: bigint) {
  const guardian = await prisma.guardians.findFirst({
    where: { user_id: userId, status: 'active' },
  })
  if (!guardian) throw new ParentalApiError('Active guardian profile not found', 403)
  return guardian
}

async function accessibleChild(guardianId: bigint, studentId: bigint) {
  const link = await prisma.student_guardians.findFirst({
    where: {
      guardian_id: guardianId,
      student_id: studentId,
      status: 'active',
      validated_at: { not: null },
      can_view_journal: true,
    },
    include: { students: true },
  })
  if (!link) throw new ParentalApiError('Child is not accessible to this Parent account', 403)
  return link
}

async function effectiveEnrollment(studentId: bigint, journalDate: Date) {
  const enrollments = await prisma.student_enrollments.findMany({
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
  })
  const dateEnd = endOfDay(journalDate)
  const enrollment = enrollments.find((candidate) => {
    const period = parentalPeriod(candidate.academic_year_classes.academic_years.start_date)
    const started = candidate.parental_tracking_started_at
    const ended = candidate.parental_tracking_ended_at
    return (
      journalDate.getTime() >= period.start.getTime() &&
      journalDate.getTime() <= period.end.getTime() &&
      started !== null &&
      started.getTime() <= dateEnd.getTime() &&
      (ended === null || ended.getTime() > journalDate.getTime())
    )
  })
  if (!enrollment) {
    throw new ParentalApiError('Parental tracking was not effective for this child on this date', 409)
  }
  return enrollment
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
    orderBy: { validated_at: 'desc' as const },
    select: { decision: true, validated_at: true },
  },
} satisfies Prisma.lesson_sessionsInclude

async function dailyLessons(academicYearClassId: bigint, journalDate: Date) {
  return prisma.lesson_sessions.findMany({
    where: {
      actual_date: journalDate,
      teacher_assignments: {
        academic_year_subjects: { academic_year_class_id: academicYearClassId },
      },
      OR: [
        { lesson_status: { in: ['published', 'validated'] } },
        { lesson_validations: { some: { decision: 'validated' } } },
      ],
    },
    include: lessonInclude,
    orderBy: [{ actual_start_time: 'asc' }, { id: 'asc' }],
  })
}

function lessonView(lesson: Awaited<ReturnType<typeof dailyLessons>>[number]) {
  const subject = lesson.teacher_assignments.academic_year_subjects.subjects
  const validation = lesson.lesson_validations[0]
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
  }
}

export async function getOwnChildren(userIdValue: string) {
  const userId = parseId(userIdValue, 'userId')
  const guardian = await guardianForUser(userId)
  const links = await prisma.student_guardians.findMany({
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
  })
  return {
    guardian_id: guardian.id,
    children: links.map((link) => ({
      relationship_type: link.relationship_type,
      is_primary: link.is_primary,
      student: {
        ...link.students,
        student_enrollments: link.students.student_enrollments.map((enrollment) => ({
          ...enrollment,
          tracking_status: enrollmentTrackingStatus(enrollment),
        })),
      },
    })),
  }
}

export async function getOwnChildJournals(
  userIdValue: string,
  studentIdValue: string,
  dateValue: unknown,
) {
  const userId = parseId(userIdValue, 'userId')
  const studentId = parseId(studentIdValue, 'studentId')
  const journalDate = parseDate(dateValue)
  const guardian = await guardianForUser(userId)
  const link = await accessibleChild(guardian.id, studentId)
  const enrollment = await effectiveEnrollment(studentId, journalDate)
  const lessons = await dailyLessons(enrollment.academic_year_class_id, journalDate)
  const acknowledgement = await prisma.parent_daily_acknowledgements.findUnique({
    where: {
      guardian_id_student_id_journal_date: {
        guardian_id: guardian.id,
        student_id: studentId,
        journal_date: journalDate,
      },
    },
  })

  await prisma.activity_logs.create({
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
  })
  return {
    student: link.students,
    journal_date: journalDate,
    lessons: lessons.map(lessonView),
    acknowledgement,
  }
}

export async function acknowledgeOwnChildJournal(
  userIdValue: string,
  studentIdValue: string,
  dateValue: unknown,
  metadata: { ipAddress?: string; userAgent?: string; comment?: unknown },
) {
  const userId = parseId(userIdValue, 'userId')
  const studentId = parseId(studentIdValue, 'studentId')
  const journalDate = parseDate(dateValue)
  const guardian = await guardianForUser(userId)
  await accessibleChild(guardian.id, studentId)
  const enrollment = await effectiveEnrollment(studentId, journalDate)
  const lessons = await dailyLessons(enrollment.academic_year_class_id, journalDate)
  if (!lessons.length) throw new ParentalApiError('No validated or published lessons exist for this date', 409)

  const snapshot = lessons.map(lessonView)
  const comment =
    metadata.comment === undefined || metadata.comment === null
      ? null
      : typeof metadata.comment === 'string'
        ? metadata.comment.trim() || null
        : (() => {
            throw new ParentalApiError('comment must be a string', 400)
          })()

  try {
    return await prisma.$transaction(async (transaction) => {
      const acknowledgement = await transaction.parent_daily_acknowledgements.create({
        data: {
          guardian_id: guardian.id,
          student_id: studentId,
          academic_year_class_id: enrollment.academic_year_class_id,
          journal_date: journalDate,
          lesson_count_snapshot: snapshot.length,
          journal_snapshot: snapshot as Prisma.InputJsonValue,
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          comment,
        },
      })
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
      })
      return acknowledgement
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ParentalApiError('This daily journal has already been acknowledged', 409)
    }
    throw error
  }
}

export async function getOwnNotifications(
  userIdValue: string,
  input: { page?: string; limit?: string; unread?: string },
) {
  const userId = parseId(userIdValue, 'userId')
  await guardianForUser(userId)
  const page = input.page ? Number(input.page) : 1
  const limit = input.limit ? Number(input.limit) : 20
  if (!Number.isInteger(page) || page <= 0) throw new ParentalApiError('page must be positive', 400)
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new ParentalApiError('limit must be between 1 and 100', 400)
  }
  let unread: boolean | undefined
  if (input.unread === 'true') unread = true
  else if (input.unread === 'false' || input.unread === undefined) unread = undefined
  else throw new ParentalApiError('unread must be true or false', 400)

  const where: Prisma.notificationsWhereInput = {
    recipient_user_id: userId,
    ...(unread ? { is_read: false } : {}),
  }
  const [notifications, total] = await prisma.$transaction([
    prisma.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notifications.count({ where }),
  ])
  return {
    notifications,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  }
}
