import type { AcademicPeriod, AnnualDistributionRow, OfficialProgramChapter, WorkingDayOptions } from '../types/management'

const monthKeys = ['sept', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun']
const monthNames = ['Sept.', 'Oct.', 'Nov.', 'Dec.', 'Janv.', 'Fevr.', 'Mars', 'Avr.', 'Mai', 'Juin']

function toUtcDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function countWorkingDays(options: WorkingDayOptions) {
  const excluded = new Set(options.excludedDates)
  const cursor = toUtcDate(options.startDate)
  const end = toUtcDate(options.endDate)
  let count = 0

  while (cursor <= end) {
    const day = cursor.getUTCDay()
    const isoDate = toIsoDate(cursor)
    const isSunday = day === 0
    const isSaturday = day === 6

    if (!isSunday && (options.includeSaturday || !isSaturday) && !excluded.has(isoDate)) {
      count += 1
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return count
}

export function buildAnnualDistribution(chapters: OfficialProgramChapter[], periods: AcademicPeriod[], calendarOptions: Pick<WorkingDayOptions, 'includeSaturday' | 'excludedDates'>): AnnualDistributionRow[] {
  const totalPeriods = chapters.reduce((total, chapter) => total + chapter.periods, 0)
  const periodSlots = periods.map((period) => ({
    period,
    quota: Math.max(1, Math.round((countWorkingDays({ ...calendarOptions, startDate: period.startDate, endDate: period.endDate }) / 180) * totalPeriods)),
    used: 0,
  }))

  let currentPeriodIndex = 0

  return chapters.map((chapter, index) => {
    const slot = periodSlots[currentPeriodIndex] || periodSlots[periodSlots.length - 1]

    if (slot.used >= slot.quota && currentPeriodIndex < periodSlots.length - 1) {
      currentPeriodIndex += 1
    }

    const nextSlot = periodSlots[currentPeriodIndex] || slot
    nextSlot.used += chapter.periods

    const startMonth = new Date(nextSlot.period.startDate).getUTCMonth()
    const academicMonthIndex = startMonth >= 8 ? startMonth - 8 : startMonth + 4

    return {
      chapterId: chapter.id,
      chapterNo: String(index + 1).padStart(2, '0'),
      chapter: chapter.title,
      subChapters: chapter.subChapters.length,
      periods: chapter.periods,
      workingDays: countWorkingDays({ ...calendarOptions, startDate: nextSlot.period.startDate, endDate: nextSlot.period.endDate }),
      periodId: nextSlot.period.id,
      plannedRange: `${monthNames[academicMonthIndex] || 'Sept.'} ${index < 9 ? '2024' : '2025'}`,
      month: monthKeys[academicMonthIndex] || 'sept',
      span: chapter.periods > 4 ? 2 : 1,
      tone: nextSlot.period.color === 'orange' ? 'yellow' : nextSlot.period.color,
    }
  })
}
