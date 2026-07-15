import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  acknowledgeOwnChildJournal,
  getOwnChildJournals,
  getOwnChildren,
  getOwnNotifications,
} from '../services/parent-portal.service'
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
  console.error(fallback, error)
  return response.status(500).json({ message: fallback })
}

export async function ownChildren(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    return response.json(serialize(await getOwnChildren(request.user.id)))
  } catch (error) {
    return handleError(response, error, 'Unable to fetch own children')
  }
}

export async function ownChildJournals(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const result = await getOwnChildJournals(
      request.user.id,
      parameter(request, 'studentId'),
      query(request.query.date),
    )
    return response.json(serialize(result))
  } catch (error) {
    return handleError(response, error, 'Unable to fetch child journals')
  }
}

export async function acknowledgeJournal(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const acknowledgement = await acknowledgeOwnChildJournal(
      request.user.id,
      parameter(request, 'studentId'),
      request.body?.journal_date,
      {
        ipAddress: request.ip,
        userAgent: request.header('User-Agent'),
        comment: request.body?.comment,
      },
    )
    return response.status(201).json({ acknowledgement: serialize(acknowledgement) })
  } catch (error) {
    return handleError(response, error, 'Unable to acknowledge daily journal')
  }
}

export async function ownNotifications(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })
  try {
    const result = await getOwnNotifications(request.user.id, {
      page: query(request.query.page),
      limit: query(request.query.limit),
      unread: query(request.query.unread),
    })
    return response.json(serialize(result))
  } catch (error) {
    return handleError(response, error, 'Unable to fetch own notifications')
  }
}
