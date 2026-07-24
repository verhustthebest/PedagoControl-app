import { apiRequest } from './api'

export type ReportStatus = 'submitted' | 'validated' | 'rejected' | 'correction_requested'
export type PrefectDecision = 'validated' | 'rejected' | 'correction_requested'

type BackendUser = {
  public_id?: string
  first_name?: string
  last_name?: string
  email?: string
}

export type BackendLessonReport = {
  public_id: string
  distribution_public_id: string
  assignment_public_id: string
  actual_date: string
  actual_periods: number
  lesson_status: ReportStatus
  lesson_summary: string
  objectives_achieved?: string | null
  exercises_given?: string | null
  homework_given?: string | null
  observations?: string | null
  teacher?: BackendUser
  assignment?: { subject?: { public_id:string; name?:string }; class?: { public_id:string; name?:string; parallel?:string|null } }
  program?: { title?:string; chapter?:string; sub_chapter?:string|null }
  validations?: Array<{ decision: PrefectDecision; observation?: string | null }>
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
  const teacherName = [report.teacher?.first_name, report.teacher?.last_name].filter(Boolean).join(' ') || 'Enseignant'
  const schoolClass = report.assignment?.class
  const subject = report.assignment?.subject
  const validation = report.validations?.[report.validations.length - 1]
  const status = statusLabel(report.lesson_status)

  return {
    id: `J-${report.public_id.slice(0, 8).toUpperCase()}`,
    rawId: report.public_id,
    programDistributionId: report.distribution_public_id,
    teacherAssignmentId: report.assignment_public_id,
    date: formatDate(report.actual_date),
    teacher: teacherName,
    className: [schoolClass?.name, schoolClass?.parallel].filter(Boolean).join(' ') || 'Classe',
    subject: subject?.name || 'Matiere',
    program: report.program?.title || 'Programme reçu',
    chapter: report.program?.chapter || 'Chapitre',
    subChapter: report.program?.sub_chapter || '',
    periods: report.actual_periods,
    summary: report.lesson_summary,
    objectives: report.objectives_achieved || '',
    exercises: report.exercises_given || '',
    homework: report.homework_given || '',
    observations: report.observations || '',
    status,
    prefectObservation: validation?.observation || report.observations || 'Aucune observation',
    decision: validation ? statusLabel(validation.decision) : status === 'Soumis' ? 'En attente' : status,
  }
}

export const reportsApi = {
  getTeacherAssignments: async () => {
    const data = await apiRequest<{ assignments: TeacherLessonAssignment[] }>('/teacher/assignments')
    return data.assignments
  },
  getTeacherReports: async () => {
    const data = await apiRequest<{ reports: BackendLessonReport[] }>('/teacher/reports')
    return data.reports.map(mapLessonReport)
  },
  createTeacherReport: (payload: CreateTeacherReportPayload) =>
    apiRequest<{ report: BackendLessonReport }>('/teacher/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTeacherReport: (publicId:string,payload:CreateTeacherReportPayload) => apiRequest<{report:BackendLessonReport}>(`/teacher/reports/${encodeURIComponent(publicId)}`,{method:'PATCH',body:JSON.stringify(payload)}),
  getPendingPrefectReports: async (filters:PrefectReportFilters={}) => {
    const query=new URLSearchParams()
    Object.entries(filters).forEach(([key,value])=>{if(value)query.set(key,value)})
    const data = await apiRequest<{ reports: BackendLessonReport[] }>(`/prefet/reports/pending${query.size?`?${query}`:''}`)
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

export type TeacherLessonAssignment={
  public_id:string
  distribution_public_id:string
  class:{public_id:string;annual_public_id:string;name:string;parallel?:string|null}
  subject:{public_id:string;name:string;code?:string|null}
  program:string
  chapter:string
  sub_chapter?:string|null
  planned_date:string
}
export type PrefectReportFilters={date?:string;class_id?:string;teacher_id?:string;subject_id?:string;status?:ReportStatus}
