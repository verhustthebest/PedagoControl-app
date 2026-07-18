import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  createGuardian,
  getGuardian,
  linkGuardianToStudent,
  listGuardians,
  setStudentGuardianEnabled,
  updateGuardian,
} from '../services/parental-guardian.service'
import { ParentalApiError } from '../services/parental.service'

function parameter(request: AuthenticatedRequest, name: string) {
  const value = request.params[name]
  return Array.isArray(value) ? value[0] : value
}

function query(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}

function handleError(response: Response, error: unknown, fallback: string) {
  if (error instanceof ParentalApiError) return response.status(error.statusCode).json({ message: error.message })
  return response.status(500).json({ message: fallback })
}

export async function indexGuardians(request: AuthenticatedRequest, response: Response) {
  try {
    const result = await listGuardians(parameter(request, 'schoolId'), {
      search: query(request.query.search),
      status: query(request.query.status),
      page: query(request.query.page),
      limit: query(request.query.limit),
    })
    return response.json(serialize(result))
  } catch (error) {
    return handleError(response, error, 'Unable to fetch guardians')
  }
}

export async function createGuardianHandler(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const guardian = await createGuardian(parameter(request, 'schoolId'), request.user.id, request.body)
    return response.status(201).json({ guardian: serialize(guardian) })
  } catch (error) {
    return handleError(response, error, 'Unable to create guardian')
  }
}

export async function showGuardian(request: AuthenticatedRequest, response: Response) {
  try {
    const guardian = await getGuardian(parameter(request, 'schoolId'), parameter(request, 'guardianId'))
    return response.json({ guardian: serialize(guardian) })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch guardian')
  }
}

export async function updateGuardianHandler(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const guardian = await updateGuardian(
      parameter(request, 'schoolId'),
      parameter(request, 'guardianId'),
      request.user.id,
      request.body,
    )
    return response.json({ guardian: serialize(guardian) })
  } catch (error) {
    return handleError(response, error, 'Unable to update guardian')
  }
}

export async function linkGuardian(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const link = await linkGuardianToStudent(
      parameter(request, 'schoolId'),
      parameter(request, 'studentId'),
      request.user.id,
      request.body,
    )
    return response.status(201).json({ link: serialize(link) })
  } catch (error) {
    return handleError(response, error, 'Unable to link guardian to student')
  }
}

export async function updateGuardianLink(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const link = await setStudentGuardianEnabled(
      parameter(request, 'schoolId'),
      parameter(request, 'studentId'),
      parameter(request, 'guardianId'),
      request.user.id,
      request.body?.enabled,
    )
    return response.json({ link: serialize(link) })
  } catch (error) {
    return handleError(response, error, 'Unable to update guardian link')
  }
}
