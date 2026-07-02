import { buildAnnualDistribution, countWorkingDays } from '../utils/academicCalendar'
import type { AnnualDistributionRow, ManagementProgramDraft } from '../types/management'

export type PreparedManagementProgram = {
  draft: ManagementProgramDraft
  totalPeriods: number
  totalSubChapters: number
  totalWorkingDays: number
  distribution: AnnualDistributionRow[]
}

export function prepareManagementProgram(draft: ManagementProgramDraft): PreparedManagementProgram {
  return {
    draft,
    totalPeriods: draft.chapters.reduce((total, chapter) => total + chapter.periods, 0),
    totalSubChapters: draft.chapters.reduce((total, chapter) => total + chapter.subChapters.length, 0),
    totalWorkingDays: countWorkingDays(draft.calendar),
    distribution: buildAnnualDistribution(draft.chapters, draft.periods, {
      includeSaturday: draft.calendar.includeSaturday,
      excludedDates: draft.calendar.excludedDates,
    }),
  }
}

export function sendProgramToAdminGestionnaire(programId: string) {
  // Future API boundary: replace this mock with POST /management/programs/:id/send-to-admin.
  return {
    programId,
    status: 'sent' as const,
    sentAt: new Date().toISOString(),
    targetPortal: 'Admin-Gestionnaire',
  }
}
