import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  createTeacherReport,
  decideReport,
  getPendingReports,
  getSupervisionReports,
  getTeacherReportsToday,
} from '../services/lesson-report.service'

function requireUser(request: AuthenticatedRequest, response: Response) {
  if (!request.user) {
    response.status(401).json({ message: 'Authentication required' })
    return null
  }

  return request.user
}

export async function teacherReportsToday(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const reports = await getTeacherReportsToday(user)
    return response.json({ reports })
  } catch (error) {
    console.error('Unable to fetch teacher reports today', error)
    return response.status(500).json({ message: 'Unable to fetch teacher reports today' })
  }
}

export async function submitTeacherReport(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const report = await createTeacherReport(user, request.body)
    return response.status(201).json({ report })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit teacher report'
    const status = message.includes('required') || message.includes('not found') ? 400 : 500
    console.error('Unable to submit teacher report', error)
    return response.status(status).json({ message })
  }
}

export async function prefetReportsPending(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const reports = await getPendingReports(user)
    return response.json({ reports })
  } catch (error) {
    console.error('Unable to fetch pending reports', error)
    return response.status(500).json({ message: 'Unable to fetch pending reports' })
  }
}

export async function decidePrefetReport(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const reportId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id

    if (!reportId) {
      return response.status(400).json({ message: 'Report id is required' })
    }

    const report = await decideReport(user, reportId, request.body)
    return response.json({ report })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to decide report'
    const status = message.includes('decision must') ? 400 : 500
    console.error('Unable to decide report', error)
    return response.status(status).json({ message })
  }
}

export async function supervisionReports(request: AuthenticatedRequest, response: Response) {
  const user = requireUser(request, response)
  if (!user) return

  try {
    const supervision = await getSupervisionReports(user)
    return response.json(supervision)
  } catch (error) {
    console.error('Unable to fetch supervision reports', error)
    return response.status(500).json({ message: 'Unable to fetch supervision reports' })
  }
}
