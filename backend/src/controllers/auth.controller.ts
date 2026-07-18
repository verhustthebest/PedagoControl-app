import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { findAuthUserById, loginWithEmailAndPassword, signAccessToken } from '../services/auth.service'
import {
  clearRefreshCookie, createAuthSession, issueCsrfToken, readRefreshCookie, requestOriginAllowed,
  revokeAllUserSessions, revokeSession, rotateRefreshToken, SessionReuseError, setRefreshCookie,
} from '../services/auth-session.service'
import { securityLog } from '../middleware/request-context.middleware'
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
    const credentials = await loginWithEmailAndPassword(email, password)

    if (!credentials) {
      const delay = loginAbuseGuard.failed(ip, identifier)
      await wait(delay)
      securityLog(request, 'login_failed', 'denied', { ip, email: identifier, delay_ms: delay })
      return response.status(401).json({ message: PUBLIC_LOGIN_ERROR })
    }

    loginAbuseGuard.succeeded(ip, identifier)
    const session = await createAuthSession(credentials.user.id, request)
    const accessToken = signAccessToken(credentials.user, session.sessionId)
    setRefreshCookie(response, session.refreshToken, session.expiresAt)
    return response.json({
      token: accessToken,
      accessToken,
      csrfToken: session.csrfToken,
      user: credentials.user,
      roles: credentials.roles,
      school_id: credentials.school_id,
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      securityLog(request, 'login_rate_limited', 'denied', { ip, email: maskContact(identifier) })
      response.setHeader('Retry-After', error.retryAfterSeconds)
      return response.status(429).json({ message: 'Too many requests. Please try again later.' })
    }
    securityLog(request, 'login_error', 'error', { error_type: error instanceof Error ? error.name : 'UnknownError' })
    return response.status(500).json({ message: PUBLIC_LOGIN_ERROR })
  }
}

const csrfHeader = () => process.env.CSRF_HEADER_NAME || 'X-CSRF-Token'
const sessionFailure = (response: Response) => response.status(401).json({ message: 'Authentication required' })

export async function csrf(request: Request, response: Response) {
  if (!requestOriginAllowed(request)) return sessionFailure(response)
  const refresh = readRefreshCookie(request)
  if (!refresh) return sessionFailure(response)
  try {
    const result = await issueCsrfToken(refresh)
    return response.json({ csrfToken: result.csrfToken })
  } catch { return sessionFailure(response) }
}

export async function refresh(request: Request, response: Response) {
  if (!requestOriginAllowed(request)) return sessionFailure(response)
  const refreshToken = readRefreshCookie(request)
  const csrfToken = request.header(csrfHeader())
  if (!refreshToken || !csrfToken) return sessionFailure(response)
  try {
    const rotated = await rotateRefreshToken(refreshToken, csrfToken)
    const user = await findAuthUserById(rotated.userId)
    if (!user) {
      await revokeSession(rotated.sessionId)
      return sessionFailure(response)
    }
    const accessToken = signAccessToken(user, rotated.sessionId)
    setRefreshCookie(response, rotated.refreshToken, rotated.expiresAt)
    return response.json({ token: accessToken, accessToken, csrfToken: rotated.csrfToken })
  } catch (error) {
    securityLog(request, error instanceof SessionReuseError ? 'refresh_token_reuse' : 'refresh_failed', 'denied')
    return sessionFailure(response)
  }
}

export async function logout(request: Request, response: Response) {
  if (!requestOriginAllowed(request)) return sessionFailure(response)
  const refreshToken = readRefreshCookie(request)
  const csrfToken = request.header(csrfHeader())
  if (!refreshToken || !csrfToken) return sessionFailure(response)
  try {
    const current = await rotateRefreshToken(refreshToken, csrfToken)
    await revokeSession(current.sessionId)
    securityLog(request, 'session_revoked', 'success')
    clearRefreshCookie(response)
    return response.status(204).send()
  } catch {
    clearRefreshCookie(response)
    return sessionFailure(response)
  }
}

export async function logoutAll(request: AuthenticatedRequest, response: Response) {
  if (!request.user || !requestOriginAllowed(request)) return sessionFailure(response)
  const refreshToken = readRefreshCookie(request)
  const csrfToken = request.header(csrfHeader())
  if (!refreshToken || !csrfToken) return sessionFailure(response)
  try {
    const current = await rotateRefreshToken(refreshToken, csrfToken)
    if (current.userId !== request.user.id) return sessionFailure(response)
    await revokeAllUserSessions(request.user.id)
    securityLog(request, 'all_sessions_revoked', 'success', { user_id: request.user.id })
    clearRefreshCookie(response)
    return response.status(204).send()
  } catch { return sessionFailure(response) }
}

export function me(request: AuthenticatedRequest, response: Response) {
  return response.json({
    user: request.user,
    roles: request.user?.roles ?? [],
    permissions: request.user?.permissions ?? [],
    school_id: request.user?.school_id ?? null,
  })
}
