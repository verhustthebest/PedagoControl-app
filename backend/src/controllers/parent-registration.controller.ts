import type { Request, Response } from 'express'
import {
  finalizeParentRegistration,
  requestParentRegistrationOtp,
  verifyParentRegistrationOtp,
} from '../services/parent-registration.service'
import { ParentalApiError } from '../services/parental.service'
import {
  fingerprint,
  normalizeIdentifier,
  otpAbuseGuard,
  publicOtpRequestResponse,
  RateLimitError,
} from '../security/abuse-protection'

function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value, (_, item) => (typeof item === 'bigint' ? item.toString() : item)))
}

function handleError(response: Response, error: unknown, fallback: string) {
  if (error instanceof RateLimitError) {
    response.setHeader('Retry-After', error.retryAfterSeconds)
    return response.status(429).json({ message: 'Too many requests. Please try again later.' })
  }
  if (error instanceof ParentalApiError) return response.status(error.statusCode).json({ message: error.message })
  return response.status(500).json({ message: fallback })
}

export async function requestOtp(request: Request, response: Response) {
  const input = request.body as { school_code?: unknown; contact?: unknown }
  const ip = request.ip || request.socket.remoteAddress || 'unknown'
  const contact = normalizeIdentifier(input.contact)
  const school = normalizeIdentifier(input.school_code)
  try {
    otpAbuseGuard.request([`otp-ip:${ip}`, `otp-contact:${contact}`, `otp-school:${school}`])
    const result = await requestParentRegistrationOtp(request.body)
    return response.status(202).json(publicOtpRequestResponse(
      String(result.verification_id),
      Math.max(1, Math.ceil((result.expires_at.getTime() - Date.now()) / 1000)),
    ))
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.locals.security_action = 'otp_rate_limited'
      return handleError(response, error, 'Unable to request registration OTP')
    }
    if (error instanceof ParentalApiError && (error.statusCode === 404 || error.statusCode === 409)) {
      return response.status(202).json(publicOtpRequestResponse())
    }
    return handleError(response, error, 'Unable to request registration OTP')
  }
}

export async function verifyOtp(request: Request, response: Response) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown'
  const input = request.body as { verification_id?: unknown }
  try {
    otpAbuseGuard.verification([`verify-ip:${ip}`, `verify-id:${fingerprint(input.verification_id)}`])
    return response.json(await verifyParentRegistrationOtp(request.body))
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.locals.security_action = 'otp_verification_rate_limited'
      return handleError(response, error, 'Unable to verify registration OTP')
    }
    if (error instanceof ParentalApiError && error.statusCode < 500) {
      response.locals.security_action = 'otp_verification_refused'
      return response.status(error.statusCode === 429 ? 429 : 400).json({ message: 'Unable to verify code' })
    }
    return handleError(response, error, 'Unable to verify registration OTP')
  }
}

export async function registerParent(request: Request, response: Response) {
  const ip = request.ip || request.socket.remoteAddress || 'unknown'
  const input = request.body as { registration_token?: unknown }
  try {
    otpAbuseGuard.registrationAttempt([`register-ip:${ip}`, `register-token:${fingerprint(input.registration_token)}`])
    return response.status(201).json(serialize(await finalizeParentRegistration(request.body)))
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.locals.security_action = 'parent_registration_rate_limited'
      return handleError(response, error, 'Unable to finalize Parent registration')
    }
    if (error instanceof ParentalApiError && error.statusCode < 500) {
      return response.status(error.statusCode === 429 ? 429 : 400).json({ message: 'Unable to finalize Parent registration' })
    }
    return handleError(response, error, 'Unable to finalize Parent registration')
  }
}
