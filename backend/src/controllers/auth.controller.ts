import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { loginWithEmailAndPassword } from '../services/auth.service'
import {
  loginAbuseGuard,
  maskContact,
  normalizeIdentifier,
  RateLimitError,
  wait,
} from '../security/abuse-protection'

const PUBLIC_LOGIN_ERROR = 'Authentication failed'

export async function login(request: Request, response: Response) {
  const { email, password } = request.body as { email?: unknown; password?: unknown }

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return response.status(400).json({ message: PUBLIC_LOGIN_ERROR })
  }

  const identifier = normalizeIdentifier(email)
  const ip = request.ip || request.socket.remoteAddress || 'unknown'
  try {
    loginAbuseGuard.begin(ip, identifier)
    const session = await loginWithEmailAndPassword(email, password)

    if (!session) {
      const delay = loginAbuseGuard.failed(ip, identifier)
      if (delay > 0) console.warn('[SECURITY] progressive login delay', { ip, identifier: maskContact(identifier), delay })
      await wait(delay)
      return response.status(401).json({ message: PUBLIC_LOGIN_ERROR })
    }

    loginAbuseGuard.succeeded(ip, identifier)
    return response.json(session)
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[SECURITY] login rate limited', { ip, identifier: maskContact(identifier) })
      response.setHeader('Retry-After', error.retryAfterSeconds)
      return response.status(429).json({ message: 'Too many requests. Please try again later.' })
    }
    console.error('Unable to login', error)
    return response.status(500).json({ message: PUBLIC_LOGIN_ERROR })
  }
}

export function me(request: AuthenticatedRequest, response: Response) {
  return response.json({
    user: request.user,
    roles: request.user?.roles ?? [],
    permissions: request.user?.permissions ?? [],
    school_id: request.user?.school_id ?? null,
  })
}
