import prisma from '../prisma/client'
import { contributionStatus, generateContributionDues } from './parent-contribution.service'

const DAY_MS = 86_400_000
const REMINDER_TYPE = 'parent_contribution_reminder_prepared'

export type AutomationResult = {
  period: string
  schools_processed: number
  dues_created: number
  statuses_updated: number
  reminders_prepared: number
  generation_skipped: boolean
}

/** Calcule un écart en jours civils UTC, stable quel que soit le fuseau du serveur. */
export function calendarDayDifference(left: Date, right: Date) {
  const l = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate())
  const r = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate())
  return Math.round((l - r) / DAY_MS)
}

/**
 * Un même délai configuré déclenche un rappel avant puis après l'échéance.
 * L'unicité applicative est assurée par destinataire, échéance et jour relatif.
 */
export function reminderOffsetForDate(dueDate: Date, reminderDays: number[], now: Date) {
  const offset = calendarDayDifference(dueDate, now)
  return reminderDays.includes(Math.abs(offset)) ? offset : null
}

async function updateStatuses(schoolId: bigint, now: Date) {
  const dues = await prisma.parent_contribution_dues.findMany({
    where: { school_id: schoolId, status: { in: ['A_RENOUVELER', 'PARTIEL', 'EN_RETARD', 'SUSPENDU'] } },
    select: { id: true, status: true, amount_due: true, amount_paid: true, due_date: true, grace_days_snapshot: true },
  })
  let updated = 0
  for (const due of dues) {
    const status = contributionStatus(due, now)
    if (status !== due.status) {
      // Les snapshots financiers restent immuables : seul le statut temporel évolue.
      await prisma.parent_contribution_dues.update({ where: { id: due.id }, data: { status, updated_at: now } })
      updated++
    }
  }
  return updated
}

async function prepareReminders(schoolId: bigint, now: Date) {
  const dues = await prisma.parent_contribution_dues.findMany({
    where: { school_id: schoolId, balance: { gt: 0 }, mode_snapshot: 'CONTRIBUTION_PARENT' },
    select: {
      id: true, due_date: true, reminder_days_snapshot: true,
      students: { select: { student_guardians: { where: { status: 'active', validated_at: { not: null }, can_receive_alerts: true }, select: { guardians: { select: { user_id: true, status: true } } } } } },
    },
  })
  let prepared = 0
  for (const due of dues) {
    const offset = reminderOffsetForDate(due.due_date, due.reminder_days_snapshot, now)
    if (offset === null) continue
    const notificationType = `${REMINDER_TYPE}_${offset < 0 ? 'after' : 'before'}_${Math.abs(offset)}`.slice(0, 50)
    for (const link of due.students.student_guardians) {
      const recipient = link.guardians.user_id
      if (!recipient || link.guardians.status !== 'active') continue
      const exists = await prisma.notifications.findFirst({ where: { recipient_user_id: recipient, notification_type: notificationType, reference_table: 'parent_contribution_dues', reference_id: due.id }, select: { id: true } })
      if (exists) continue
      await prisma.notifications.create({ data: {
        recipient_user_id: recipient,
        title: 'Rappel de contribution préparé',
        message: offset < 0 ? 'Une contribution à votre école est arrivée à échéance.' : 'Une contribution à votre école arrive prochainement à échéance.',
        notification_type: notificationType,
        reference_table: 'parent_contribution_dues',
        reference_id: due.id,
      } })
      prepared++
    }
  }
  return prepared
}

/**
 * Exécute l'automatisation mensuelle de façon idempotente pour toutes les écoles
 * configurées. Aucun fournisseur externe n'est simulé : les rappels restent préparés.
 */
export async function runParentContributionAutomation(now = new Date()): Promise<AutomationResult> {
  const month = now.getUTCMonth() + 1
  const period = `${now.getUTCFullYear()}-${String(month).padStart(2, '0')}`
  const generationSkipped = month === 7 || month === 8 || (month === 6 && now.getUTCDate() > 15)
  const settings = await prisma.parent_contribution_settings.findMany({ select: { school_id: true } })
  const result: AutomationResult = { period, schools_processed: 0, dues_created: 0, statuses_updated: 0, reminders_prepared: 0, generation_skipped: generationSkipped }
  for (const setting of settings) {
    if (!generationSkipped) result.dues_created += (await generateContributionDues(setting.school_id.toString(), period)).created
    result.statuses_updated += await updateStatuses(setting.school_id, now)
    result.reminders_prepared += await prepareReminders(setting.school_id, now)
    result.schools_processed++
  }
  console.info(JSON.stringify({ event: 'parent_contribution_automation', outcome: 'success', occurred_at: now.toISOString(), ...result }))
  return result
}
