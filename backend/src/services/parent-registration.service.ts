import { randomInt } from 'crypto'
import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import prisma from '../prisma/client'
import { ParentalApiError } from './parental.service'
import { type OtpChannel, sendRegistrationOtp } from './otp-provider.service'
import { RateLimitError } from '../security/abuse-protection'
import { hashOtp, safelyCompareOtp } from '../security/otp-security'
import { consumeActionToken, issueActionToken } from './action-token.service'

const PURPOSE = 'parent_registration'
const CHANNELS: OtpChannel[] = ['email', 'whatsapp', 'sms']

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function parseId(value: unknown, field: string) {
  try {
    if (typeof value !== 'string') throw new Error()
    const id = BigInt(value)
    if (id <= 0n) throw new Error()
    return id
  } catch {
    throw new ParentalApiError(`${field} must be a valid positive id`, 400)
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ParentalApiError(`${field} is required`, 400)
  }
  return value.trim()
}

function parseChannel(value: unknown): OtpChannel {
  const channel = requiredString(value, 'channel').toLowerCase() as OtpChannel
  if (!CHANNELS.includes(channel)) {
    throw new ParentalApiError('channel must be email, whatsapp or sms', 400)
  }
  return channel
}

function normalizeContact(value: unknown, channel: OtpChannel) {
  const contact = requiredString(value, 'contact')
  if (channel === 'email') {
    const email = contact.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ParentalApiError('contact must be a valid email address', 400)
    }
    return email
  }
  return contact
}

async function publicAudit(params: {
  schoolId: bigint
  guardianCreatedById: bigint | null
  type: string
  referenceId: bigint
  title: string
  description: string
}) {
  const fallback = params.guardianCreatedById
    ? { id: params.guardianCreatedById }
    : await prisma.users.findFirst({
        where: { user_roles: { some: { roles: { name: 'SUPER_ADMIN', is_active: true } } } },
        select: { id: true },
      })
  if (!fallback) return

  await prisma.activity_logs.create({
    data: {
      school_id: params.schoolId,
      user_id: fallback.id,
      activity_type: params.type,
      module_name: 'parental_tracking',
      reference_table: 'contact_verifications',
      reference_id: params.referenceId,
      title: params.title,
      description: params.description,
    },
  })
}

export async function requestParentRegistrationOtp(input: {
  school_code?: unknown
  contact?: unknown
  channel?: unknown
}) {
  const schoolCode = requiredString(input.school_code, 'school_code')
  const channel = parseChannel(input.channel)
  const contact = normalizeContact(input.contact, channel)
  const school = await prisma.schools.findFirst({
    where: { code: { equals: schoolCode, mode: 'insensitive' }, status: 'active' },
  })
  if (!school) throw new ParentalApiError('Active school not found', 404)

  const guardians = await prisma.guardians.findMany({
    where: {
      school_id: school.id,
      status: 'active',
      ...(channel === 'email'
        ? { email: { equals: contact, mode: 'insensitive' } }
        : { phone: contact }),
      user_id: null,
      student_guardians: {
        some: {
          status: 'active',
          validated_at: { not: null },
          students: { school_id: school.id, status: 'active' },
        },
      },
    },
    take: 2,
  })
  if (!guardians.length) {
    throw new ParentalApiError('No eligible guardian matches this school and contact', 404)
  }
  if (guardians.length > 1) {
    throw new ParentalApiError('Several guardians use this contact; school assistance is required', 409)
  }

  const guardian = guardians[0]
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60_000)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60_000)
  const [latest, guardianHour, guardianDay, schoolHour, schoolDay] = await Promise.all([
    prisma.contact_verifications.findFirst({
      where: { guardian_id: guardian.id, purpose: PURPOSE },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    }),
    prisma.contact_verifications.count({ where: { guardian_id: guardian.id, purpose: PURPOSE, created_at: { gte: hourAgo } } }),
    prisma.contact_verifications.count({ where: { guardian_id: guardian.id, purpose: PURPOSE, created_at: { gte: dayAgo } } }),
    prisma.contact_verifications.count({ where: { guardians: { school_id: school.id }, purpose: PURPOSE, created_at: { gte: hourAgo } } }),
    prisma.contact_verifications.count({ where: { guardians: { school_id: school.id }, purpose: PURPOSE, created_at: { gte: dayAgo } } }),
  ])
  const resendDelaySeconds = positiveInteger('OTP_RESEND_MIN_SECONDS', 60)
  if (latest) {
    const availableAt = latest.created_at.getTime() + resendDelaySeconds * 1000
    if (availableAt > now.getTime()) throw new RateLimitError(Math.ceil((availableAt - now.getTime()) / 1000))
  }
  if (
    guardianHour >= positiveInteger('OTP_GUARDIAN_MAX_PER_HOUR', 4) ||
    guardianDay >= positiveInteger('OTP_GUARDIAN_MAX_PER_DAY', 10) ||
    schoolHour >= positiveInteger('OTP_SCHOOL_MAX_PER_HOUR', 100) ||
    schoolDay >= positiveInteger('OTP_SCHOOL_MAX_PER_DAY', 500)
  ) {
    throw new RateLimitError(3600)
  }
  const settings = await prisma.school_parental_settings.findUnique({ where: { school_id: school.id } })
  const expiresInMinutes = settings?.otp_expiry_minutes ?? 10
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
  const otpHash = await hashOtp(code)
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60_000)

  await prisma.contact_verifications.updateMany({
    where: { guardian_id: guardian.id, purpose: PURPOSE, status: 'pending' },
    data: { status: 'superseded' },
  })
  const verification = await prisma.contact_verifications.create({
    data: {
      guardian_id: guardian.id,
      contact_type: channel,
      contact_value: contact,
      otp_hash: otpHash,
      purpose: PURPOSE,
      status: 'pending',
      expires_at: expiresAt,
    },
  })

  try {
    await sendRegistrationOtp({
      channel,
      destination: contact,
      code,
      schoolName: school.name,
    })
  } catch (error) {
    await prisma.contact_verifications.update({
      where: { id: verification.id },
      data: { status: 'delivery_failed' },
    })
    throw error
  }

  await publicAudit({
    schoolId: school.id,
    guardianCreatedById: guardian.created_by_user_id,
    type: 'parent_otp_requested',
    referenceId: verification.id,
    title: 'Demande OTP inscription Parent',
    description: `Un OTP d inscription Parent a ete envoye par ${channel}.`,
  })

  return {
    verification_id: verification.id,
    channel,
    expires_at: expiresAt,
  }
}

export async function verifyParentRegistrationOtp(input: {
  verification_id?: unknown
  otp?: unknown
}) {
  const verificationId = parseId(input.verification_id, 'verification_id')
  const otp = requiredString(input.otp, 'otp')
  if (!/^\d{6}$/.test(otp)) throw new ParentalApiError('otp must contain exactly 6 digits', 400)

  const verification = await prisma.contact_verifications.findUnique({
    where: { id: verificationId },
    include: { guardians: true },
  })
  if (!verification || verification.purpose !== PURPOSE || verification.status !== 'pending') {
    throw new ParentalApiError('OTP verification is not pending or does not exist', 400)
  }
  const settings = await prisma.school_parental_settings.findUnique({
    where: { school_id: verification.guardians.school_id },
  })
  const maxAttempts = settings?.otp_max_attempts ?? 5
  if (verification.expires_at.getTime() <= Date.now()) {
    await prisma.contact_verifications.update({
      where: { id: verification.id },
      data: { status: 'expired' },
    })
    throw new ParentalApiError('OTP has expired', 400)
  }
  if (verification.attempts_count >= maxAttempts) {
    throw new ParentalApiError('Maximum OTP attempts reached', 429)
  }

  const valid = await safelyCompareOtp(otp, verification.otp_hash)
  if (!valid) {
    const attempts = verification.attempts_count + 1
    await prisma.contact_verifications.update({
      where: { id: verification.id },
      data: {
        attempts_count: attempts,
        ...(attempts >= maxAttempts ? { status: 'failed' } : {}),
      },
    })
    throw new ParentalApiError(
      attempts >= maxAttempts ? 'Maximum OTP attempts reached' : 'Invalid OTP',
      attempts >= maxAttempts ? 429 : 400,
    )
  }

  await prisma.contact_verifications.update({
    where: { id: verification.id },
    data: { status: 'verified', verified_at: new Date() },
  })
  await publicAudit({
    schoolId: verification.guardians.school_id,
    guardianCreatedById: verification.guardians.created_by_user_id,
    type: 'parent_otp_verified',
    referenceId: verification.id,
    title: 'Verification OTP inscription Parent',
    description: 'L OTP d inscription Parent a ete verifie.',
  })

  const issued = await issueActionToken('parent_activation', {
    guardianId: verification.guardian_id.toString(),
    resourcePublicId: verification.guardians.public_id,
  })
  return {
    registration_token: issued.token,
    expires_in_seconds: Math.max(1, Math.ceil((issued.expiresAt.getTime() - Date.now()) / 1000)),
  }
}

export async function finalizeParentRegistration(input: {
  registration_token?: unknown
  password?: unknown
}) {
  const token = requiredString(input.registration_token, 'registration_token')
  const password = requiredString(input.password, 'password')
  if (password.length < 8) throw new ParentalApiError('password must contain at least 8 characters', 400)

  let actionToken
  try {
    actionToken = await consumeActionToken(token, 'parent_activation')
  } catch {
    throw new ParentalApiError('Registration token is invalid or expired', 401)
  }
  if (!actionToken.guardian_id) {
    throw new ParentalApiError('Registration token is invalid or expired', 401)
  }
  const guardianId = actionToken.guardian_id
  const verification = await prisma.contact_verifications.findFirst({
    where: {
      guardian_id: guardianId,
      purpose: PURPOSE,
      status: 'verified',
      consumed_at: null,
    },
    orderBy: { verified_at: 'desc' },
    include: {
      guardians: {
        include: {
          student_guardians: {
            where: { status: 'active', validated_at: { not: null } },
            select: { id: true },
          },
        },
      },
    },
  })
  if (!verification) throw new ParentalApiError('Verified registration cannot be finalized', 400)
  const guardian = verification.guardians
  if (guardian.user_id) throw new ParentalApiError('This guardian already has a Parent account', 409)
  if (!guardian.student_guardians.length) {
    throw new ParentalApiError('Guardian no longer has an active validated child link', 409)
  }

  const role = await prisma.roles.findFirst({ where: { name: 'PARENT', is_active: true } })
  if (!role) throw new ParentalApiError('PARENT role is not configured', 503)
  const email = guardian.email?.trim().toLowerCase() ?? `parent.guardian.${guardian.id}@phone.pedagocontrol.local`
  const phone = guardian.phone?.trim() ?? null
  const duplicate = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: { id: true },
  })
  if (duplicate) throw new ParentalApiError('A user already uses this email or phone', 409)
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const freshGuardian = await transaction.guardians.findUnique({ where: { id: guardian.id } })
        if (!freshGuardian || freshGuardian.user_id) {
          throw new ParentalApiError('This guardian already has a Parent account', 409)
        }
        const user = await transaction.users.create({
          data: {
            school_id: guardian.school_id,
            first_name: guardian.first_name,
            last_name: guardian.last_name,
            email,
            phone,
            password_hash: passwordHash,
            is_active: true,
          },
        })
        await transaction.user_roles.create({
          data: { user_id: user.id, role_id: role.id },
        })
        await transaction.guardians.update({
          where: { id: guardian.id },
          data: { user_id: user.id, updated_at: new Date() },
        })
        await transaction.contact_verifications.update({
          where: { id: verification.id },
          data: { status: 'consumed', consumed_at: new Date() },
        })
        await transaction.activity_logs.create({
          data: {
            school_id: guardian.school_id,
            user_id: user.id,
            activity_type: 'parent_account_registered',
            module_name: 'parental_tracking',
            reference_table: 'guardians',
            reference_id: guardian.id,
            title: 'Creation du compte Parent',
            description: 'Le compte Parent a ete cree apres verification OTP.',
          },
        })
        return {
          user: {
            id: user.id,
            email: guardian.email ?? null,
            phone: user.phone,
            first_name: user.first_name,
            last_name: user.last_name,
            school_id: user.school_id,
          },
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  } catch (error) {
    if (error instanceof ParentalApiError) throw error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    ) {
      throw new ParentalApiError('Parent account registration conflicts with an existing account', 409)
    }
    throw error
  }
}
