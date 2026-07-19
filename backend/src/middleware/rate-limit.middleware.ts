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
  response.locals = response.locals ?? {}
  response.locals.security_action = 'rate_limit'
  response.setHeader('Retry-After', result.retryAfterSeconds)
  return response.status(429).json({ message: 'Too many requests. Please try again later.' })
}
const notificationTestLimiter=new SlidingWindowLimiter(positiveInteger('NOTIFICATION_TEST_RATE_LIMIT_MAX',10),positiveInteger('NOTIFICATION_TEST_RATE_LIMIT_WINDOW_MINUTES',15)*60_000)
/** Limite dédiée aux envois réels de diagnostic. */
export function notificationTestRateLimit(request:Request,response:Response,next:NextFunction){const user=(request as Request&{user?:{id?:string}}).user;const result=notificationTestLimiter.consume(`notification-test:${user?.id||request.ip}`);if(result.allowed)return next();response.locals.security_action='notification_test_rate_limit';response.setHeader('Retry-After',result.retryAfterSeconds);return response.status(429).json({message:'Too many requests. Please try again later.'})}
