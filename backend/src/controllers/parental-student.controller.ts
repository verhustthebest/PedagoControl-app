import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  createStudent,
  getStudent,
  listStudents,
  setStudentTracking,
  updateStudent,
} from '../services/parental-student.service'
import { ParentalApiError } from '../services/parental.service'

function parameter(request: AuthenticatedRequest, name: string) {
  const value = request.params[name]
  return Array.isArray(value) ? value[0] : value
}

function queryValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)),
  )
}

function presentStudent(value: unknown) {
  const student = serialize(value) as Record<string, unknown>
  const enrollments = student.student_enrollments as unknown[] | undefined
  student.enrollment = enrollments?.[0] ?? null
  delete student.student_enrollments

  const enrollment = student.enrollment as Record<string, unknown> | null
  if (enrollment) {
    const enabled = enrollment.parental_tracking_enabled === true
    const startedAt =
      typeof enrollment.parental_tracking_started_at === 'string'
        ? new Date(enrollment.parental_tracking_started_at)
        : null
    const endedAt =
      typeof enrollment.parental_tracking_ended_at === 'string'
        ? new Date(enrollment.parental_tracking_ended_at)
        : null
    const academicYearClass = enrollment.academic_year_classes as
      | { academic_years?: { start_date?: string } }
      | undefined
    const academicYearStart = academicYearClass?.academic_years?.start_date
      ? new Date(academicYearClass.academic_years.start_date)
      : null
    const billingEnd = academicYearStart
      ? new Date(Date.UTC(academicYearStart.getUTCFullYear() + 1, 5, 15, 23, 59, 59, 999))
      : null
    const now = new Date()

    enrollment.tracking_status =
      !enabled || (endedAt !== null && endedAt.getTime() <= now.getTime()) ||
      (billingEnd !== null && billingEnd.getTime() < now.getTime() && (!startedAt || startedAt <= now))
        ? 'inactive'
        : startedAt !== null && startedAt.getTime() > now.getTime()
          ? 'scheduled'
          : 'active'
  }
  return student
}

function handleError(response: Response, error: unknown, fallback: string) {
  if (error instanceof ParentalApiError) {
    return response.status(error.statusCode).json({ message: error.message })
  }
  if (error instanceof SyntaxError) {
    return response.status(400).json({ message: 'Invalid request payload' })
  }

  console.error(fallback, error)
  return response.status(500).json({ message: fallback })
}

export async function indexStudents(request: AuthenticatedRequest, response: Response) {
  try {
    const result = await listStudents(parameter(request, 'schoolId'), {
      search: queryValue(request.query.search),
      academic_year_class_id: queryValue(request.query.academic_year_class_id ?? request.query.class_id),
      status: queryValue(request.query.status),
      parental_tracking_enabled: queryValue(request.query.parental_tracking_enabled ?? request.query.tracking),
      page: queryValue(request.query.page),
      limit: queryValue(request.query.limit),
    })
    return response.json({
      students: result.students.map(presentStudent),
      pagination: result.pagination,
    })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch students')
  }
}

export async function createStudentHandler(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const student = await createStudent(parameter(request, 'schoolId'), request.user.id, request.body)
    return response.status(201).json({ student: presentStudent(student) })
  } catch (error) {
    return handleError(response, error, 'Unable to create student')
  }
}

export async function showStudent(request: AuthenticatedRequest, response: Response) {
  try {
    const student = await getStudent(parameter(request, 'schoolId'), parameter(request, 'studentId'))
    return response.json({ student: presentStudent(student) })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch student')
  }
}

export async function updateStudentHandler(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const student = await updateStudent(
      parameter(request, 'schoolId'),
      parameter(request, 'studentId'),
      request.user.id,
      request.body,
    )
    return response.json({ student: presentStudent(student) })
  } catch (error) {
    return handleError(response, error, 'Unable to update student')
  }
}

export async function updateStudentTracking(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const student = await setStudentTracking(
      parameter(request, 'schoolId'),
      parameter(request, 'studentId'),
      request.user.id,
      request.body?.enabled,
    )
    return response.json({ student: presentStudent(student) })
  } catch (error) {
    return handleError(response, error, 'Unable to update parental tracking')
  }
}
