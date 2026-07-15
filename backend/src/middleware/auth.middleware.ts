import type { NextFunction, Request, Response } from 'express'
import { findAuthUserById, verifyAuthToken } from '../services/auth.service'
import type { AuthUser } from '../services/auth.service'

export type AuthenticatedRequest = Request & {
  user?: AuthUser
}

export async function authenticateBearerToken(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.header('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Bearer token required' })
  }

  const token = authorization.slice('Bearer '.length).trim()

  try {
    const payload = verifyAuthToken(token)
    const user = await findAuthUserById(payload.sub)

    if (!user) {
      return response.status(401).json({ message: 'Invalid token user' })
    }

    request.user = user
    return next()
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requirePermission(code: string) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }

    if (request.user.roles.includes('SUPER_ADMIN') || request.user.permissions.includes(code)) {
      return next()
    }

    return response.status(403).json({ message: `Permission required: ${code}` })
  }
}

export function requireRole(role: string) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' })
    }
    if (!request.user.roles.includes(role)) {
      return response.status(403).json({ message: `Role required: ${role}` })
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

    if (request.user.school_id && BigInt(request.user.school_id) !== BigInt(requestedSchoolId)) {
      return response.status(403).json({ message: 'Access to another school is forbidden' })
    }

    return next()
  }
}
