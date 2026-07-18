import type { NextFunction, Request, Response } from 'express'
import { findAuthUserById, verifyAuthToken } from '../services/auth.service'
import type { AuthUser } from '../services/auth.service'
import { assertActiveSession, revokeSession } from '../services/auth-session.service'
import { securityLog } from './request-context.middleware'
import prisma from '../prisma/client'
import { isPublicId } from '../security/public-id'
import {
  hasAnyRole,
  hasUsableSchoolContext,
  isSuperAdmin,
} from '../security/access-policy'

export type AuthenticatedRequest = Request & {
  user?: AuthUser
  session_id?: string
}

export async function authenticateBearerToken(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required' })
  }

  const token = authorization.slice('Bearer '.length).trim()

  try {
    const payload = verifyAuthToken(token)
    const [user, sessionActive] = await Promise.all([
      findAuthUserById(payload.sub), assertActiveSession(payload.sid, payload.sub),
    ])

    if (!user && sessionActive) await revokeSession(payload.sid)
    if (!user || !sessionActive || user.school_id !== payload.school_id) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    request.user = user
    request.session_id = payload.sid
    return next()
  } catch {
    securityLog(request, 'access_token_rejected', 'denied')
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
  return async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    const rawSchoolId = request.params[parameterName]
    const requestedSchoolId = Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId

    if (!requestedSchoolId || (!/^\d+$/.test(requestedSchoolId) && !isPublicId(requestedSchoolId))) {
      return response.status(400).json({ message: 'A valid school id is required' })
    }

    let internalSchoolId: bigint
    if (isPublicId(requestedSchoolId)) {
      const school = await prisma.schools.findUnique({ where: { public_id: requestedSchoolId }, select: { id: true } })
      if (!school) return response.status(404).json({ message: 'Resource not found' })
      internalSchoolId = school.id
    } else {
      internalSchoolId = BigInt(requestedSchoolId)
      if (internalSchoolId <= 0n) return response.status(400).json({ message: 'A valid school id is required' })
    }

    if (!request.user.school_id && !isSuperAdmin(request.user)) {
      return response.status(403).json({ message: 'Access forbidden' })
    }

    if (request.user.school_id && BigInt(request.user.school_id) !== internalSchoolId) {
      response.locals = response.locals ?? {}
      response.locals.security_action = 'cross_school_access_refused'
      return response.status(404).json({ message: 'Resource not found' })
    }

    request.params[parameterName] = internalSchoolId.toString()

    return next()
  }
}
