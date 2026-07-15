import type { Request, Response } from 'express'
import {
  finalizeParentRegistration,
  requestParentRegistrationOtp,
  verifyParentRegistrationOtp,
} from '../services/parent-registration.service'
import { ParentalApiError } from '../services/parental.service'

function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}

function handleError(response: Response, error: unknown, fallback: string) {
  if (error instanceof ParentalApiError) return response.status(error.statusCode).json({ message: error.message })
  console.error(fallback, error)
  return response.status(500).json({ message: fallback })
}

export async function requestOtp(request: Request, response: Response) {
  try {
    return response.status(201).json(serialize(await requestParentRegistrationOtp(request.body)))
  } catch (error) {
    return handleError(response, error, 'Unable to request registration OTP')
  }
}

export async function verifyOtp(request: Request, response: Response) {
  try {
    return response.json(await verifyParentRegistrationOtp(request.body))
  } catch (error) {
    return handleError(response, error, 'Unable to verify registration OTP')
  }
}

export async function registerParent(request: Request, response: Response) {
  try {
    return response.status(201).json(serialize(await finalizeParentRegistration(request.body)))
  } catch (error) {
    return handleError(response, error, 'Unable to finalize Parent registration')
  }
}
