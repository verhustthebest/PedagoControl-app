import { randomBytes } from 'crypto'
import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'
import { ParentalApiError } from './parental.service'

const studentInclude = {
  student_enrollments: {
    where: { status: 'active' },
    include: {
      academic_year_classes: {
        include: {
          academic_years: true,
          school_classes: true,
        },
      },
      school_parental_subscriptions: true,
    },
    orderBy: { created_at: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.studentsInclude

export type ListStudentsInput = {
  search?: string
  academic_year_class_id?: string
  status?: string
  parental_tracking_enabled?: string
  page?: string
  limit?: string
}

export type CreateStudentInput = {
  first_name?: string
  last_name?: string
  middle_name?: string
  gender?: string
  birth_date?: string
  birth_place?: string
  address?: string
  profile_photo?: string | null
  status?: string
  academic_year_class_id?: string
}

export type UpdateStudentInput = Partial<CreateStudentInput> & {
  school_id?: unknown
  matricule?: unknown
}

function parseId(value: string, field: string) {
  try {
    const id = BigInt(value)
    if (id <= 0n) throw new Error()
    return id
  } catch {
    throw new ParentalApiError(`${field} must be a valid positive id`, 400)
  }
}

function utcDateOnly(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ParentalApiError(`${field} is required`, 400)
  }
  return value.trim()
}

function optionalText(value: unknown, field: string) {
  if (value === undefined) return undefined
  return requiredText(value, field)
}

function optionalNullableText(value: unknown, field: string) {
  if (value === undefined || value === null) return value
  return requiredText(value, field)
}

function parseGender(value: unknown, required: boolean) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string') {
    throw new ParentalApiError('gender must be M or F', 400)
  }

  const gender = value.trim().toUpperCase()
  if (gender !== 'M' && gender !== 'F') {
    throw new ParentalApiError('gender must be M or F', 400)
  }
  return gender
}

function parseBirthDate(value: unknown, required: boolean) {
  if (value === undefined && !required) return undefined
  if (typeof value !== 'string') {
    throw new ParentalApiError('birth_date must use YYYY-MM-DD', 400)
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new ParentalApiError('birth_date must use YYYY-MM-DD', 400)

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new ParentalApiError('birth_date is invalid', 400)
  }
  return date
}

function parsePagination(value: string | undefined, fallback: number, field: string, maximum?: number) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || (maximum !== undefined && parsed > maximum)) {
    throw new ParentalApiError(
      maximum ? `${field} must be an integer between 1 and ${maximum}` : `${field} must be a positive integer`,
      400,
    )
  }
  return parsed
}

async function ensureSchool(schoolId: bigint) {
  const school = await prisma.schools.findUnique({ where: { id: schoolId }, select: { id: true } })
  if (!school) throw new ParentalApiError('School not found', 404)
}

async function ensureClassBelongsToSchool(academicYearClassId: bigint, schoolId: bigint) {
  const academicYearClass = await prisma.academic_year_classes.findFirst({
    where: {
      id: academicYearClassId,
      is_active: true,
      academic_years: { school_id: schoolId },
      school_classes: { school_id: schoolId },
    },
    select: { id: true },
  })
  if (!academicYearClass) {
    throw new ParentalApiError('Academic year class not found in this school', 404)
  }
}

async function findStudentInSchool(studentId: bigint, schoolId: bigint) {
  const student = await prisma.students.findFirst({
    where: { id: studentId, school_id: schoolId },
    include: studentInclude,
  })
  if (!student) throw new ParentalApiError('Student not found in this school', 404)
  return student
}

function generateMatricule(schoolId: bigint) {
  const year = new Date().getUTCFullYear()
  return `STD-${schoolId.toString()}-${year}-${randomBytes(5).toString('hex').toUpperCase()}`
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function activityData(params: {
  schoolId: bigint
  userId: bigint
  studentId: bigint
  type: string
  title: string
  description: string
}) {
  return {
    school_id: params.schoolId,
    user_id: params.userId,
    activity_type: params.type,
    module_name: 'parental_tracking',
    reference_table: 'students',
    reference_id: params.studentId,
    title: params.title,
    description: params.description,
  }
}

export async function listStudents(schoolIdValue: string, input: ListStudentsInput) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  await ensureSchool(schoolId)

  const page = parsePagination(input.page, 1, 'page')
  const limit = parsePagination(input.limit, 20, 'limit', 100)
  const search = input.search?.trim()
  const academicYearClassId = input.academic_year_class_id
    ? parseId(input.academic_year_class_id, 'academic_year_class_id')
    : undefined

  let trackingEnabled: boolean | undefined
  if (input.parental_tracking_enabled !== undefined) {
    if (input.parental_tracking_enabled === 'true') trackingEnabled = true
    else if (input.parental_tracking_enabled === 'false') trackingEnabled = false
    else throw new ParentalApiError('parental_tracking_enabled must be true or false', 400)
  }

  const activeEnrollmentFilter: Prisma.student_enrollmentsWhereInput = {
    status: 'active',
    ...(academicYearClassId ? { academic_year_class_id: academicYearClassId } : {}),
    ...(trackingEnabled !== undefined ? { parental_tracking_enabled: trackingEnabled } : {}),
  }
  const where: Prisma.studentsWhereInput = {
    school_id: schoolId,
    ...(input.status ? { status: input.status } : {}),
    ...(search
      ? {
          OR: [
            { matricule: { contains: search, mode: 'insensitive' } },
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { middle_name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(academicYearClassId || trackingEnabled !== undefined
      ? { student_enrollments: { some: activeEnrollmentFilter } }
      : {}),
  }

  const [students, total] = await prisma.$transaction([
    prisma.students.findMany({
      where,
      include: studentInclude,
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.students.count({ where }),
  ])

  return {
    students,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  }
}

export async function getStudent(schoolIdValue: string, studentIdValue: string) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const studentId = parseId(studentIdValue, 'studentId')
  await ensureSchool(schoolId)
  return findStudentInSchool(studentId, schoolId)
}

export async function createStudent(
  schoolIdValue: string,
  actorUserId: string,
  input: CreateStudentInput,
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const actorId = parseId(actorUserId, 'actorUserId')
  await ensureSchool(schoolId)

  const academicYearClassId = input.academic_year_class_id
    ? parseId(input.academic_year_class_id, 'academic_year_class_id')
    : undefined
  if (academicYearClassId) await ensureClassBelongsToSchool(academicYearClassId, schoolId)

  const data = {
    first_name: requiredText(input.first_name, 'first_name'),
    last_name: requiredText(input.last_name, 'last_name'),
    middle_name: requiredText(input.middle_name, 'middle_name'),
    gender: parseGender(input.gender, true) as 'M' | 'F',
    birth_date: parseBirthDate(input.birth_date, true) as Date,
    birth_place: requiredText(input.birth_place, 'birth_place'),
    address: requiredText(input.address, 'address'),
    profile_photo: optionalNullableText(input.profile_photo, 'profile_photo') ?? null,
    status: input.status ? requiredText(input.status, 'status') : 'active',
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const student = await transaction.students.create({
          data: {
            ...data,
            school_id: schoolId,
            matricule: generateMatricule(schoolId),
            created_by_user_id: actorId,
          },
        })

        if (academicYearClassId) {
          await transaction.student_enrollments.create({
            data: {
              student_id: student.id,
              academic_year_class_id: academicYearClassId,
              enrolled_by_user_id: actorId,
              enrollment_date: utcDateOnly(),
              status: 'active',
            },
          })
        }

        await transaction.activity_logs.create({
          data: activityData({
            schoolId,
            userId: actorId,
            studentId: student.id,
            type: 'parental_student_created',
            title: 'Creation d un eleve',
            description: `Eleve ${student.matricule} cree dans le module Suivi parental.`,
          }),
        })

        return transaction.students.findUniqueOrThrow({
          where: { id: student.id },
          include: studentInclude,
        })
      })
    } catch (error) {
      if (!isUniqueConflict(error)) throw error
    }
  }

  throw new ParentalApiError('Unable to generate a unique student matricule', 409)
}

export async function updateStudent(
  schoolIdValue: string,
  studentIdValue: string,
  actorUserId: string,
  input: UpdateStudentInput,
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const studentId = parseId(studentIdValue, 'studentId')
  const actorId = parseId(actorUserId, 'actorUserId')
  await ensureSchool(schoolId)
  await findStudentInSchool(studentId, schoolId)

  if (input.school_id !== undefined || input.matricule !== undefined) {
    throw new ParentalApiError('school_id and matricule cannot be changed', 400)
  }

  const academicYearClassId = input.academic_year_class_id
    ? parseId(input.academic_year_class_id, 'academic_year_class_id')
    : undefined
  if (academicYearClassId) await ensureClassBelongsToSchool(academicYearClassId, schoolId)

  const studentData: Prisma.studentsUpdateManyMutationInput = {
    ...(input.first_name !== undefined ? { first_name: optionalText(input.first_name, 'first_name') } : {}),
    ...(input.last_name !== undefined ? { last_name: optionalText(input.last_name, 'last_name') } : {}),
    ...(input.middle_name !== undefined ? { middle_name: optionalText(input.middle_name, 'middle_name') } : {}),
    ...(input.gender !== undefined ? { gender: parseGender(input.gender, false) } : {}),
    ...(input.birth_date !== undefined ? { birth_date: parseBirthDate(input.birth_date, false) } : {}),
    ...(input.birth_place !== undefined ? { birth_place: optionalText(input.birth_place, 'birth_place') } : {}),
    ...(input.address !== undefined ? { address: optionalText(input.address, 'address') } : {}),
    ...(input.profile_photo !== undefined
      ? { profile_photo: optionalNullableText(input.profile_photo, 'profile_photo') }
      : {}),
    ...(input.status !== undefined ? { status: optionalText(input.status, 'status') } : {}),
    updated_at: new Date(),
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.students.updateMany({
      where: { id: studentId, school_id: schoolId },
      data: studentData,
    })

    if (academicYearClassId) {
      const currentEnrollment = await transaction.student_enrollments.findFirst({
        where: { student_id: studentId, status: 'active' },
        orderBy: { created_at: 'desc' },
      })

      if (!currentEnrollment || currentEnrollment.academic_year_class_id !== academicYearClassId) {
        const now = new Date()
        await transaction.student_enrollments.updateMany({
          where: { student_id: studentId, status: 'active' },
          data: {
            status: 'inactive',
            parental_tracking_enabled: false,
            parental_tracking_ended_at: now,
            updated_at: now,
          },
        })

        await transaction.student_enrollments.upsert({
          where: {
            student_id_academic_year_class_id: {
              student_id: studentId,
              academic_year_class_id: academicYearClassId,
            },
          },
          update: {
            status: 'active',
            enrolled_by_user_id: actorId,
            enrollment_date: utcDateOnly(),
            parental_tracking_enabled: currentEnrollment?.parental_tracking_enabled ?? false,
            parental_tracking_started_at: currentEnrollment?.parental_tracking_started_at,
            parental_tracking_ended_at: currentEnrollment?.parental_tracking_enabled ? null : currentEnrollment?.parental_tracking_ended_at,
            school_parental_subscription_id: currentEnrollment?.school_parental_subscription_id,
            updated_at: now,
          },
          create: {
            student_id: studentId,
            academic_year_class_id: academicYearClassId,
            enrolled_by_user_id: actorId,
            enrollment_date: utcDateOnly(),
            status: 'active',
            parental_tracking_enabled: currentEnrollment?.parental_tracking_enabled ?? false,
            parental_tracking_started_at: currentEnrollment?.parental_tracking_started_at,
            school_parental_subscription_id: currentEnrollment?.school_parental_subscription_id,
          },
        })
      }
    }

    await transaction.activity_logs.create({
      data: activityData({
        schoolId,
        userId: actorId,
        studentId,
        type: 'parental_student_updated',
        title: 'Modification d un eleve',
        description: 'Les informations ou la classe de l eleve ont ete mises a jour.',
      }),
    })

    return transaction.students.findUniqueOrThrow({
      where: { id: studentId },
      include: studentInclude,
    })
  })
}

function parentalPeriod(academicYearStart: Date) {
  const startYear = academicYearStart.getUTCFullYear()
  return {
    start: new Date(Date.UTC(startYear, 8, 1)),
    end: new Date(Date.UTC(startYear + 1, 5, 15)),
  }
}

export function enrollmentTrackingStatus(enrollment: {
  parental_tracking_enabled: boolean
  parental_tracking_started_at: Date | string | null
  parental_tracking_ended_at: Date | string | null
  academic_year_classes?: { academic_years?: { start_date: Date | string } }
}, now = new Date()) {
  const startedAt = enrollment.parental_tracking_started_at
    ? new Date(enrollment.parental_tracking_started_at)
    : null
  const endedAt = enrollment.parental_tracking_ended_at
    ? new Date(enrollment.parental_tracking_ended_at)
    : null
  const academicYearStart = enrollment.academic_year_classes?.academic_years?.start_date
    ? new Date(enrollment.academic_year_classes.academic_years.start_date)
    : null
  const billingEnd = academicYearStart ? parentalPeriod(academicYearStart).end : null

  if (
    !enrollment.parental_tracking_enabled ||
    (endedAt !== null && endedAt.getTime() <= now.getTime()) ||
    (billingEnd !== null && billingEnd.getTime() < now.getTime() && (!startedAt || startedAt <= now))
  ) {
    return 'inactive' as const
  }
  if (startedAt && startedAt.getTime() > now.getTime()) return 'scheduled' as const
  return 'active' as const
}

function endOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999),
  )
}

export async function countBillableParentalStudents(
  schoolIdValue: string,
  monthValue: Date,
  parentalSubscriptionId?: bigint,
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const month = monthValue.getUTCMonth()
  if (month === 6 || month === 7) return 0

  const cutoffDate =
    month === 5
      ? new Date(Date.UTC(monthValue.getUTCFullYear(), 5, 15))
      : new Date(Date.UTC(monthValue.getUTCFullYear(), month + 1, 0))
  const cutoff = endOfUtcDay(cutoffDate)

  return prisma.student_enrollments.count({
    where: {
      parental_tracking_started_at: { lte: cutoff },
      OR: [{ parental_tracking_ended_at: null }, { parental_tracking_ended_at: { gt: cutoff } }],
      ...(parentalSubscriptionId
        ? { school_parental_subscription_id: parentalSubscriptionId }
        : {}),
      students: { school_id: schoolId },
      academic_year_classes: {
        academic_years: {
          start_date: { lte: cutoffDate },
          end_date: { gte: cutoffDate },
        },
      },
    },
  })
}

export async function setStudentTracking(
  schoolIdValue: string,
  studentIdValue: string,
  actorUserId: string,
  enabled: unknown,
) {
  if (typeof enabled !== 'boolean') {
    throw new ParentalApiError('enabled must be a boolean', 400)
  }

  const schoolId = parseId(schoolIdValue, 'schoolId')
  const studentId = parseId(studentIdValue, 'studentId')
  const actorId = parseId(actorUserId, 'actorUserId')
  await ensureSchool(schoolId)
  await findStudentInSchool(studentId, schoolId)

  const enrollments = await prisma.student_enrollments.findMany({
    where: { student_id: studentId, status: 'active' },
    include: {
      academic_year_classes: {
        include: {
          academic_years: true,
        },
      },
    },
  })
  if (!enrollments.length) {
    throw new ParentalApiError('Student has no active annual enrollment', 409)
  }

  const now = new Date()
  const today = utcDateOnly(now)
  const validEnrollments = enrollments
    .map((enrollment) => ({
      enrollment,
      period: parentalPeriod(enrollment.academic_year_classes.academic_years.start_date),
    }))
    .filter(({ period }) => period.end.getTime() >= today.getTime())
    .sort((left, right) => left.period.start.getTime() - right.period.start.getTime())

  const selected = enabled
    ? validEnrollments[0]
    : enrollments
        .filter((enrollment) => enrollment.parental_tracking_enabled)
        .map((enrollment) => ({
          enrollment,
          period: parentalPeriod(enrollment.academic_year_classes.academic_years.start_date),
        }))
        .sort(
          (left, right) =>
            (right.enrollment.parental_tracking_started_at?.getTime() ?? 0) -
            (left.enrollment.parental_tracking_started_at?.getTime() ?? 0),
        )[0] ?? validEnrollments[0]

  if (!selected) {
    throw new ParentalApiError(
      'The student academic year is finished and no valid upcoming school period exists',
      409,
    )
  }

  const { enrollment, period } = selected
  const academicYearStart = utcDateOnly(enrollment.academic_year_classes.academic_years.start_date)
  const computedStart =
    today.getTime() < academicYearStart.getTime()
      ? academicYearStart
      : today.getTime() < period.start.getTime()
        ? period.start
      : today.getTime() <= period.end.getTime()
        ? now
        : null
  if (enabled && !computedStart) {
    throw new ParentalApiError(
      'The student academic year is finished and no valid upcoming school period exists',
      409,
    )
  }

  const existingStart = enrollment.parental_tracking_started_at
  const effectiveStart =
    enabled && enrollment.parental_tracking_enabled && existingStart
      ? existingStart.getTime() < academicYearStart.getTime()
        ? academicYearStart
        : existingStart
      : computedStart
  let subscriptionId = enrollment.school_parental_subscription_id
  if (enabled) {
    const settings = await prisma.school_parental_settings.findUnique({ where: { school_id: schoolId } })
    if (!settings?.is_enabled) {
      throw new ParentalApiError('Parental tracking module is not active for this school', 409)
    }

    const effectiveStartDate = utcDateOnly(effectiveStart as Date)
    const subscription = await prisma.school_parental_subscriptions.findFirst({
      where: {
        school_id: schoolId,
        status: 'active',
        start_date: { lte: effectiveStartDate },
        end_date: { gte: effectiveStartDate },
        school_subscriptions: {
          status: 'active',
          start_date: { lte: effectiveStartDate },
          end_date: { gte: effectiveStartDate },
        },
      },
      orderBy: { created_at: 'desc' },
    })
    if (!subscription) {
      throw new ParentalApiError(
        'No active parental subscription covers the effective parental tracking start date',
        409,
      )
    }
    subscriptionId = subscription.id
  }

  const stateChanged = enrollment.parental_tracking_enabled !== enabled
  const wasScheduled =
    enrollment.parental_tracking_enabled &&
    enrollment.parental_tracking_started_at !== null &&
    enrollment.parental_tracking_started_at.getTime() > now.getTime()
  return prisma.$transaction(async (transaction) => {
    await transaction.student_enrollments.update({
      where: { id: enrollment.id },
      data: enabled
        ? {
            parental_tracking_enabled: true,
            parental_tracking_started_at: effectiveStart,
            parental_tracking_ended_at: null,
            school_parental_subscription_id: subscriptionId,
            updated_at: now,
          }
        : {
            parental_tracking_enabled: false,
            parental_tracking_started_at: wasScheduled ? null : enrollment.parental_tracking_started_at,
            parental_tracking_ended_at: wasScheduled
              ? null
              : stateChanged
                ? now
                : enrollment.parental_tracking_ended_at,
            updated_at: now,
          },
    })

    if (stateChanged) {
      await transaction.activity_logs.create({
        data: activityData({
          schoolId,
          userId: actorId,
          studentId,
          type: enabled ? 'parental_tracking_activated' : 'parental_tracking_disabled',
          title: enabled ? 'Activation du suivi parental' : 'Desactivation du suivi parental',
          description: enabled
            ? 'Le suivi parental a ete active pour l inscription annuelle de l eleve.'
            : 'Le suivi parental a ete desactive sans supprimer son historique.',
        }),
      })
    }

    return transaction.students.findUniqueOrThrow({
      where: { id: studentId },
      include: studentInclude,
    })
  })
}
