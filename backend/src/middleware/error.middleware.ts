import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { securityLog, type RequestWithContext } from './request-context.middleware'

const PUBLIC_MESSAGES: Record<number, string> = {
  400: 'Invalid request', 401: 'Authentication required', 403: 'Access forbidden',
  404: 'Resource not found', 409: 'Request conflict', 413: 'Request body too large',
  429: 'Too many requests. Please try again later.', 500: 'Internal server error',
}

export function notFound(request: Request, response: Response) {
  return response.status(404).json({ message: PUBLIC_MESSAGES[404], request_id: (request as RequestWithContext).requestId })
}

export function globalErrorHandler(error: unknown, request: Request, response: Response, _next: NextFunction) {
  const candidate = error as { type?: string; status?: number; statusCode?: number }
  let status = candidate?.type === 'entity.too.large' || candidate?.status === 413 ? 413 : candidate?.statusCode ?? candidate?.status ?? 500
  if (![400, 401, 403, 404, 409, 413, 429].includes(status)) status = 500
  if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientUnknownRequestError) status = 500
  const action = candidate?.statusCode === 403 ? 'cors_origin_refused' : 'unhandled_error'
  response.locals.security_action = action
  securityLog(request as RequestWithContext, action, 'error', { error_type: error instanceof Error ? error.name : 'UnknownError' })
  return response.status(status).json({ message: PUBLIC_MESSAGES[status] ?? PUBLIC_MESSAGES[500] })
}
