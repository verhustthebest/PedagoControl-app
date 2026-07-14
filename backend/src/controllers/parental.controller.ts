import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import {
  getParentalSettings,
  getParentalSubscription,
  ParentalApiError,
  updateParentalSettings,
  updateParentalSubscription,
} from '../services/parental.service'

function serialize(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)),
  )
}

function serializeSettings<T extends { daily_acknowledgement_deadline: Date | null } | null>(settings: T) {
  if (!settings) return settings

  const serialized = serialize(settings) as Record<string, unknown>
  const deadline = settings.daily_acknowledgement_deadline
  serialized.daily_acknowledgement_deadline = deadline
    ? [deadline.getUTCHours(), deadline.getUTCMinutes(), deadline.getUTCSeconds()]
        .map((part) => part.toString().padStart(2, '0'))
        .join(':')
    : null

  return serialized
}

function schoolIdFrom(request: AuthenticatedRequest) {
  const value = request.params.schoolId
  return Array.isArray(value) ? value[0] : value
}

function handleError(response: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ParentalApiError) {
    return response.status(error.statusCode).json({ message: error.message })
  }

  console.error(fallbackMessage, error)
  return response.status(500).json({ message: fallbackMessage })
}

export async function showParentalSettings(request: AuthenticatedRequest, response: Response) {
  try {
    const settings = await getParentalSettings(schoolIdFrom(request))
    return response.json({ settings: serializeSettings(settings) })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch parental settings')
  }
}

export async function saveParentalSettings(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })

  try {
    const settings = await updateParentalSettings(schoolIdFrom(request), request.user.id, request.body)
    return response.json({ settings: serializeSettings(settings) })
  } catch (error) {
    return handleError(response, error, 'Unable to update parental settings')
  }
}

export async function showParentalSubscription(request: AuthenticatedRequest, response: Response) {
  try {
    const subscription = await getParentalSubscription(schoolIdFrom(request))
    return response.json({ subscription: serialize(subscription) })
  } catch (error) {
    return handleError(response, error, 'Unable to fetch parental subscription')
  }
}

export async function saveParentalSubscription(request: AuthenticatedRequest, response: Response) {
  if (!request.user) return response.status(401).json({ message: 'Authentication required' })

  try {
    const subscription = await updateParentalSubscription(schoolIdFrom(request), request.user.id, request.body)
    return response.json({ subscription: serialize(subscription) })
  } catch (error) {
    return handleError(response, error, 'Unable to update parental subscription')
  }
}
