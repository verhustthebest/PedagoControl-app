import { apiRequest } from './api'

export type ReportStatus = 'submitted' | 'validated' | 'rejected' | 'correction_requested'
export type PrefectDecision = 'validated' | 'rejected' | 'correction_requested'

type BackendUser = {
  first_name?: string
  last_name?: string
  email?: string
}

type BackendProgramDistribution = {
  id: string | number
  planned_periods?: number
  program_chapters?: { title?: string }
  program_sub_chapters?: { title?: string } | null
  annual_programs?: { title?: string }
}

type BackendTeacherAssignment = {
  academic_year_subjects?: {
    subjects?: { name?: string }
    academic_year_classes?: {
      school_classes?: { name?: string; parallel?: string | null }
    }
  }
}

export type BackendLessonReport = {
  id: string | number
  program_distribution_id: string | number
  teacher_assignment_id: string | number
  actual_date: string
  actual_periods: number
  lesson_status: ReportStatus
  lesson_summary: string
  objectives_achieved?: string | null
  exercises_given?: string | null
  homework_given?: string | null
  observations?: string | null
  users?: BackendUser
  teacher_assignments?: BackendTeacherAssignment
  program_distribution?: BackendProgramDistribution
  lesson_validations?: Array<{ decision: PrefectDecision; validation_comment?: string | null }>
  lesson_comments?: Array<{ comment_text?: string | null }>
}

export type UiLessonReport = {
  id: string
  rawId: string
  programDistributionId: string
  teacherAssignmentId: string
  date: string
  teacher: string
  className: string
  subject: string
  program: string
  chapter: string
  subChapter: string
  periods: number
  summary: string
  objectives: string
  exercises: string
  homework: string
  observations: string
  status: string
  prefectObservation: string
  decision: string
}

export type CreateTeacherReportPayload = {
  program_distribution_id: string
  teacher_assignment_id: string
  actual_date: string
  actual_periods: number
  lesson_summary: string
  objectives_achieved?: string
  exercises_given?: string
  homework_given?: string
  observations?: string
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-')
  if (year && month && day) return `${day}/${month}/${year}`

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('fr-FR').format(date)
}

function statusLabel(status: ReportStatus) {
  if (status === 'validated') return 'Valide'
  if (status === 'rejected') return 'Rejete'
  if (status === 'correction_requested') return 'Correction demandee'
  return 'Soumis'
}

export function mapLessonReport(report: BackendLessonReport): UiLessonReport {
  const teacherName = [report.users?.first_name, report.users?.last_name].filter(Boolean).join(' ') || report.users?.email || 'Enseignant'
  const schoolClass = report.teacher_assignments?.academic_year_subjects?.academic_year_classes?.school_classes
  const subject = report.teacher_assignments?.academic_year_subjects?.subjects
  const validation = report.lesson_validations?.[report.lesson_validations.length - 1]
  const comment = report.lesson_comments?.[report.lesson_comments.length - 1]
  const status = statusLabel(report.lesson_status)

  return {
    id: `RQC-${String(report.id).padStart(3, '0')}`,
    rawId: String(report.id),
    programDistributionId: String(report.program_distribution_id),
    teacherAssignmentId: String(report.teacher_assignment_id),
    date: formatDate(report.actual_date),
    teacher: teacherName,
    className: [schoolClass?.name, schoolClass?.parallel].filter(Boolean).join(' ') || 'Classe',
    subject: subject?.name || 'Matiere',
    program: report.program_distribution?.annual_programs?.title || 'Programme recu',
    chapter: report.program_distribution?.program_chapters?.title || 'Chapitre',
    subChapter: report.program_distribution?.program_sub_chapters?.title || 'Sous-chapitre',
    periods: report.actual_periods,
    summary: report.lesson_summary,
    objectives: report.objectives_achieved || '',
    exercises: report.exercises_given || '',
    homework: report.homework_given || '',
    observations: report.observations || '',
    status,
    prefectObservation: validation?.validation_comment || comment?.comment_text || report.observations || 'Aucune observation',
    decision: validation ? statusLabel(validation.decision) : status === 'Soumis' ? 'En attente' : status,
  }
}

export const reportsApi = {
  getTeacherReports: async () => {
    const data = await apiRequest<{ reports: BackendLessonReport[] }>('/teacher/reports')
    return data.reports.map(mapLessonReport)
  },
  createTeacherReport: (payload: CreateTeacherReportPayload) =>
    apiRequest<{ report: BackendLessonReport }>('/teacher/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPendingPrefectReports: async () => {
    const data = await apiRequest<{ reports: BackendLessonReport[] }>('/prefet/reports/pending')
    return data.reports.map(mapLessonReport)
  },
  decidePrefectReport: (id: string, decision: PrefectDecision, observation: string) =>
    apiRequest<{ report: BackendLessonReport }>(`/prefet/reports/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, observation }),
    }),
  getSupervisionReports: async () => {
    const data = await apiRequest<{ summary: { soumis: number; valides: number; rejetes: number; corrections: number }; latest_reports: BackendLessonReport[] }>('/supervision/reports')
    return {
      summary: data.summary,
      reports: data.latest_reports.map(mapLessonReport),
    }
  },
}
