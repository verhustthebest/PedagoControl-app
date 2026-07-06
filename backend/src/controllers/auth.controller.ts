import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.middleware'
import { loginWithEmailAndPassword } from '../services/auth.service'

export async function login(request: Request, response: Response) {
  const { email, password } = request.body as { email?: string; password?: string }

  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required' })
  }

  try {
    const session = await loginWithEmailAndPassword(email, password)

    if (!session) {
      return response.status(401).json({ message: 'Invalid email or password' })
    }

    return response.json(session)
  } catch (error) {
    console.error('Unable to login', error)
    return response.status(500).json({ message: 'Unable to login' })
  }
}

export function me(request: AuthenticatedRequest, response: Response) {
  return response.json({
    user: request.user,
    roles: request.user?.roles ?? [],
    school_id: request.user?.school_id ?? null,
  })
}
