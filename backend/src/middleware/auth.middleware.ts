import type { NextFunction, Request, Response } from 'express'
import { findAuthUserById, verifyAuthToken } from '../services/auth.service'
import type { AuthUser } from '../services/auth.service'
import { randomUUID } from 'crypto'
import {
  hasAnyRole,
  hasUsableSchoolContext,
  isSuperAdmin,
} from '../security/access-policy'

export type AuthenticatedRequest = Request & {
  user?: AuthUser
}

export async function authenticateBearerToken(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required' })
  }

  const token = authorization.slice('Bearer '.length).trim()

  try {
    const payload = verifyAuthToken(token)
    const user = await findAuthUserById(payload.sub)

    if (!user || user.school_id !== payload.school_id) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    request.user = user
    return next()
  } catch {
    const requestId = request.header('X-Request-ID')?.slice(0, 100) || randomUUID()
    response.setHeader('X-Request-ID', requestId)
    console.warn('[SECURITY] access token rejected', { request_id: requestId })
    return response.status(401).json({ message: 'Authentication required' })
  }
}

export function requirePermission(code: string) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    if (isSuperAdmin(request.user) || request.user.permissions.includes(code)) {
      return next()
    }

    return response.status(403).json({ message: 'Access forbidden' })
  }
}

export function requireRole(role: string) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }
    if (!request.user.roles.includes(role)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }
    return next()
  }
}

export function requireAnyRole(roles: readonly string[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }
    if (!hasAnyRole(request.user, roles)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }
    return next()
  }
}

export function requireSchoolContext() {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }
    if (!hasUsableSchoolContext(request.user)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }
    return next()
  }
}

export function requireSchoolScope(parameterName = 'schoolId') {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    const rawSchoolId = request.params[parameterName]
    const requestedSchoolId = Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId

    if (!requestedSchoolId || !/^\d+$/.test(requestedSchoolId) || BigInt(requestedSchoolId) <= 0n) {
      return response.status(400).json({ message: 'A valid school id is required' })
    }

    if (!request.user.school_id && !isSuperAdmin(request.user)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }

    if (request.user.school_id && BigInt(request.user.school_id) !== BigInt(requestedSchoolId)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }

    return next()
  }
}
