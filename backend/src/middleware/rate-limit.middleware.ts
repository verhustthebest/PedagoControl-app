import type { NextFunction, Request, Response } from 'express'
import { SlidingWindowLimiter } from '../security/abuse-protection'

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

const globalLimiter = new SlidingWindowLimiter(
  positiveInteger('API_RATE_LIMIT_MAX', 300),
  positiveInteger('API_RATE_LIMIT_WINDOW_MINUTES', 15) * 60_000,
)

export function globalApiRateLimit(request: Request, response: Response, next: NextFunction) {
  const result = globalLimiter.consume(`global:${request.ip}`)
  if (result.allowed) return next()
  response.setHeader('Retry-After', result.retryAfterSeconds)
  return response.status(429).json({ message: 'Too many requests. Please try again later.' })
}
