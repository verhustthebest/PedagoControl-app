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
