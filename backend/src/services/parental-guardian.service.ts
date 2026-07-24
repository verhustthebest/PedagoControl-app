import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'
import { ParentalApiError } from './parental.service'
import { normalizeDrcPhone, PHONE_CONFLICT_MESSAGE } from '../security/phone-identity'

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
    orderBy: { created_at: 'desc' as const },
  },
} satisfies Prisma.guardiansInclude

export type GuardianInput = {
  first_name?: string
  last_name?: string
  middle_name?: string | null
  phone?: string | null
  email?: string | null
  national_id_number?: string | null
  occupation?: string | null
  address?: string | null
  preferred_contact_method?: string | null
  status?: string
}

export type StudentGuardianInput = {
  guardian_id?: string
  relationship_type?: string
  is_primary?: boolean
  can_receive_alerts?: boolean
  can_view_journal?: boolean
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

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ParentalApiError(`${field} is required`, 400)
  }
  return value.trim()
}

function nullableText(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return null
  return requiredText(value, field)
}

function normalizeEmail(value: unknown) {
  const email = nullableText(value, 'email')?.toLowerCase() ?? null
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ParentalApiError('email must be valid', 400)
  }
  return email
}

function normalizePhone(value: unknown) {
  const phone=nullableText(value,'phone')
  if(!phone)return null
  try{return normalizeDrcPhone(phone)}catch{throw new ParentalApiError('Le numéro doit être un numéro congolais valide au format +243.',400)}
}

function parsePage(value: string | undefined, fallback: number, maximum?: number) {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || (maximum && parsed > maximum)) {
    throw new ParentalApiError(maximum ? `limit must be between 1 and ${maximum}` : 'page must be positive', 400)
  }
  return parsed
}

function audit(params: {
  schoolId: bigint
  userId: bigint
  referenceTable: string
  referenceId: bigint
  type: string
  title: string
  description: string
}) {
  return {
    school_id: params.schoolId,
    user_id: params.userId,
    activity_type: params.type,
    module_name: 'parental_tracking',
    reference_table: params.referenceTable,
    reference_id: params.referenceId,
    title: params.title,
    description: params.description,
  }
}

async function ensureSchool(schoolId: bigint) {
  const school = await prisma.schools.findUnique({ where: { id: schoolId }, select: { id: true } })
  if (!school) throw new ParentalApiError('School not found', 404)
}

async function findGuardian(schoolId: bigint, guardianId: bigint) {
  const guardian = await prisma.guardians.findFirst({
    where: { id: guardianId, school_id: schoolId },
    include: guardianInclude,
  })
  if (!guardian) throw new ParentalApiError('Guardian not found in this school', 404)
  return guardian
}

function contactDuplicateWhere(schoolId: bigint, phone: string | null, email: string | null, excludeId?: bigint) {
  const contacts: Prisma.guardiansWhereInput[] = []
  if (phone) contacts.push({ phone })
  if (email) contacts.push({ email: { equals: email, mode: 'insensitive' } })
  return {
    school_id: schoolId,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    OR: contacts,
  } satisfies Prisma.guardiansWhereInput
}

export async function listGuardians(
  schoolIdValue: string,
  input: { search?: string; status?: string; page?: string; limit?: string },
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  await ensureSchool(schoolId)
  const page = parsePage(input.page, 1)
  const limit = parsePage(input.limit, 20, 100)
  const search = input.search?.trim()
  const where: Prisma.guardiansWhereInput = {
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
  }
  const [guardians, total] = await prisma.$transaction([
    prisma.guardians.findMany({
      where,
      include: guardianInclude,
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.guardians.count({ where }),
  ])
  return {
    guardians,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  }
}

export async function getGuardian(schoolIdValue: string, guardianIdValue: string) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const guardianId = parseId(guardianIdValue, 'guardianId')
  await ensureSchool(schoolId)
  return findGuardian(schoolId, guardianId)
}

export async function createGuardian(schoolIdValue: string, actorUserId: string, input: GuardianInput) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const actorId = parseId(actorUserId, 'actorUserId')
  await ensureSchool(schoolId)
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  if (!phone && !email) throw new ParentalApiError('phone or email is required', 400)

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const duplicate = await transaction.guardians.findFirst({
          where: contactDuplicateWhere(schoolId, phone, email),
          select: { id: true },
        })
        if (duplicate) throw new ParentalApiError(phone ? PHONE_CONFLICT_MESSAGE : 'A guardian with this email already exists', 409)

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
        })
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
        })
        return transaction.guardians.findUniqueOrThrow({
          where: { id: guardian.id },
          include: guardianInclude,
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  } catch (error) {
    if (error instanceof ParentalApiError) throw error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new ParentalApiError('A concurrent guardian creation conflict occurred', 409)
    }
    throw error
  }
}

export async function updateGuardian(
  schoolIdValue: string,
  guardianIdValue: string,
  actorUserId: string,
  input: GuardianInput,
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const guardianId = parseId(guardianIdValue, 'guardianId')
  const actorId = parseId(actorUserId, 'actorUserId')
  await ensureSchool(schoolId)
  const existing = await findGuardian(schoolId, guardianId)
  const phone = input.phone === undefined ? existing.phone : normalizePhone(input.phone)
  const email = input.email === undefined ? existing.email : normalizeEmail(input.email)
  if (!phone && !email) throw new ParentalApiError('phone or email is required', 400)

  return prisma.$transaction(
    async (transaction) => {
      const duplicate = await transaction.guardians.findFirst({
        where: contactDuplicateWhere(schoolId, phone, email, guardianId),
        select: { id: true },
      })
      if (duplicate) throw new ParentalApiError(phone ? PHONE_CONFLICT_MESSAGE : 'A guardian with this email already exists', 409)

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
      })
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
      })
      return transaction.guardians.findUniqueOrThrow({
        where: { id: guardian.id },
        include: guardianInclude,
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

export async function linkGuardianToStudent(
  schoolIdValue: string,
  studentIdValue: string,
  actorUserId: string,
  input: StudentGuardianInput,
) {
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const studentId = parseId(studentIdValue, 'studentId')
  const actorId = parseId(actorUserId, 'actorUserId')
  const guardianId = parseId(requiredText(input.guardian_id, 'guardian_id'), 'guardian_id')
  const relationshipType = requiredText(input.relationship_type, 'relationship_type')
  const [student, guardian] = await Promise.all([
    prisma.students.findFirst({ where: { id: studentId, school_id: schoolId }, select: { id: true } }),
    prisma.guardians.findFirst({ where: { id: guardianId, school_id: schoolId }, select: { id: true } }),
  ])
  if (!student) throw new ParentalApiError('Student not found in this school', 404)
  if (!guardian) throw new ParentalApiError('Guardian not found in this school', 404)

  const existing = await prisma.student_guardians.findUnique({
    where: { student_id_guardian_id: { student_id: studentId, guardian_id: guardianId } },
    select: { id: true },
  })
  if (existing) throw new ParentalApiError('This guardian is already linked to this student', 409)

  return prisma.$transaction(async (transaction) => {
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
    })
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
    })
    return link
  })
}

export async function setStudentGuardianEnabled(
  schoolIdValue: string,
  studentIdValue: string,
  guardianIdValue: string,
  actorUserId: string,
  enabled: unknown,
) {
  if (typeof enabled !== 'boolean') throw new ParentalApiError('enabled must be a boolean', 400)
  const schoolId = parseId(schoolIdValue, 'schoolId')
  const studentId = parseId(studentIdValue, 'studentId')
  const guardianId = parseId(guardianIdValue, 'guardianId')
  const actorId = parseId(actorUserId, 'actorUserId')
  const link = await prisma.student_guardians.findFirst({
    where: {
      student_id: studentId,
      guardian_id: guardianId,
      students: { school_id: schoolId },
      guardians: { school_id: schoolId },
    },
  })
  if (!link) throw new ParentalApiError('Guardian link not found in this school', 404)

  const status = enabled ? 'active' : 'inactive'
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.student_guardians.update({
      where: { id: link.id },
      data: {
        status,
        ...(enabled ? { validated_by_user_id: actorId, validated_at: new Date() } : {}),
        updated_at: new Date(),
      },
      include: { guardians: true, students: true },
    })
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
      })
    }
    return updated
  })
}
