export type AcademicPeriodKind = 'trimester' | 'semester' | 'custom'

export type AcademicPeriod = {
  id: string
  name: string
  kind: AcademicPeriodKind
  startDate: string
  endDate: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}

export type OfficialProgramChapter = {
  id: string
  title: string
  subChapters: string[]
  periods: number
}

export type WorkingDayOptions = {
  startDate: string
  endDate: string
  includeSaturday: boolean
  excludedDates: string[]
}

export type AnnualDistributionRow = {
  chapterId: string
  chapterNo: string
  chapter: string
  subChapters: number
  periods: number
  workingDays: number
  periodId: string
  plannedRange: string
  month: string
  span: number
  tone: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'red'
}

export type ManagementProgramDraft = {
  id: string
  schoolYear: string
  className: string
  subject: string
  createdBy: string
  status: 'draft' | 'generated' | 'sent'
  calendar: WorkingDayOptions
  periods: AcademicPeriod[]
  chapters: OfficialProgramChapter[]
}
