import type { AuthUser } from './auth.service'
import prisma from '../prisma/client'
import { canBroadcast, isSuperAdmin } from '../security/access-policy'

function toBigInt(value: string | number | bigint) {
  return typeof value === 'bigint' ? value : BigInt(value)
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}

function reportContext(report: {
  actual_date: Date
  users?: { first_name: string | null; last_name: string | null; email: string }
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

async function enrichLessonNotifications<T extends Array<{ reference_table: string | null; reference_id: bigint | null; message: string }>>(notifications: T) {
  const lessonIds = notifications
    .filter((notification) => notification.reference_table === 'lesson_sessions' && notification.reference_id)
    .map((notification) => notification.reference_id as bigint)

  if (!lessonIds.length) return notifications

  const reports = await prisma.lesson_sessions.findMany({
    where: { id: { in: lessonIds } },
    include: {
      users: { select: { first_name: true, last_name: true, email: true } },
      teacher_assignments: {
        include: {
          academic_year_subjects: {
            include: {
              subjects: true,
              academic_year_classes: { include: { school_classes: true } },
            },
          },
        },
      },
    },
  })

  const contextById = new Map(reports.map((report) => [report.id.toString(), reportContext(report)]))

  return notifications.map((notification) => {
    if (notification.reference_table !== 'lesson_sessions' || !notification.reference_id) return notification
    const context = contextById.get(notification.reference_id.toString())
    if (!context) return notification
    const decisionPrefix = notification.message.includes(' - ') ? notification.message.split(' - ')[0] : ''
    return { ...notification, message: decisionPrefix && ['validated', 'rejected', 'correction_requested'].includes(decisionPrefix) ? `${decisionPrefix} - ${context}` : context }
  }) as T
}

export async function getUserNotifications(user: AuthUser) {
  const notifications = await prisma.notifications.findMany({
    where: {
      recipient_user_id: toBigInt(user.id),
      notification_type: { not: 'message' },
    },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  return serialize(await enrichLessonNotifications(notifications))
}

export async function getUserMessages(user: AuthUser) {
  const messages = await prisma.notifications.findMany({
    where: {
      recipient_user_id: toBigInt(user.id),
      notification_type: 'message',
    },
    orderBy: { created_at: 'desc' },
    take: 20,
  })

  return serialize(messages)
}

export async function broadcastMessage(user: AuthUser, input: { title?: string; message?: string; recipient?: string }) {
  if (!input.message) {
    throw new Error('message is required')
  }

  if (!canBroadcast(user)) throw new Error('Access forbidden')
  if (!user.school_id && !isSuperAdmin(user)) throw new Error('Access forbidden')

  const recipients = await prisma.users.findMany({
    where: {
      is_active: true,
      ...(user.school_id ? { school_id: toBigInt(user.school_id) } : {}),
      ...(input.recipient === 'teachers' || input.recipient === 'all_teachers' ? {
        user_roles: {
          some: {
            roles: { name: 'ENSEIGNANT' },
          },
        },
      } : {}),
      id: { not: toBigInt(user.id) },
    },
    select: { id: true },
  })

  if (!recipients.length) return []

  await prisma.notifications.createMany({
    data: recipients.map((recipient) => ({
      recipient_user_id: recipient.id,
      sender_user_id: toBigInt(user.id),
      title: input.title || 'Nouveau message',
      message: input.message || '',
      notification_type: 'message',
      reference_table: 'notifications',
    })),
  })

  return getUserMessages(user)
}

export async function getUnreadNotificationCount(user: AuthUser) {
  return prisma.notifications.count({
    where: {
      recipient_user_id: toBigInt(user.id),
      is_read: false,
      notification_type: { not: 'message' },
    },
  })
}

export async function markNotificationRead(user: AuthUser, id: string) {
  const notification = await prisma.notifications.findFirst({
    where: {
      id: toBigInt(id),
      recipient_user_id: toBigInt(user.id),
    },
  })

  if (!notification) {
    throw new Error('Notification not found')
  }

  const updated = await prisma.notifications.update({
    where: { id: notification.id },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  })

  return serialize(updated)
}

export async function markAllNotificationsRead(user: AuthUser) {
  await prisma.notifications.updateMany({
    where: {
      recipient_user_id: toBigInt(user.id),
      is_read: false,
      notification_type: { not: 'message' },
    },
    data: {
      is_read: true,
      read_at: new Date(),
    },
  })

  return getUnreadNotificationCount(user)
}
