import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'

const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{7,63}$/
const SENSITIVE_KEYS = /password|passwd|otp|jwt|token|authorization|cookie|csrf|secret|api[_-]?key/i

export type RequestWithContext = Request & { requestId?: string }

export function maskEmail(value: string) {
  const [local, domain] = value.split('@')
  if (!domain) return '[redacted]'
  return `${local.slice(0, 2)}***@${domain}`
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length > 4 ? `***${digits.slice(-4)}` : '***'
}

export function maskIp(value: string) {
  if (value.includes(':')) return `${value.split(':').slice(0, 2).join(':')}:*`
  const parts = value.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : '[masked]'
}

export function redact(value: unknown, key = ''): unknown {
  if (SENSITIVE_KEYS.test(key)) return '[redacted]'
  if (typeof value === 'string') {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return maskEmail(value)
    if (/^\+?[\d\s().-]{7,}$/.test(value)) return maskPhone(value)
    return value.length > 500 ? `${value.slice(0, 500)}…` : value
  }
  if (Array.isArray(value)) return value.map(item => redact(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([itemKey, item]) => [itemKey, redact(item, itemKey)]))
  }
  return value
}

export function structuredLog(level: 'info' | 'warn' | 'error', event: Record<string, unknown>) {
  const line = JSON.stringify(redact({ date: new Date().toISOString(), ...event }))
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function securityLog(request: RequestWithContext, action: string, result: 'success' | 'denied' | 'error', details: Record<string, unknown> = {}) {
  structuredLog(result === 'success' ? 'info' : 'warn', {
    request_id: request.requestId,
    method: request.method,
    route: request.originalUrl?.split('?')[0],
    user_id: (request as Request & { user?: { id?: string } }).user?.id,
    action,
    result,
    ...details,
  })
}

export function requestContext(request: RequestWithContext, response: Response, next: NextFunction) {
  const incoming = request.header('X-Request-ID')
  const requestId = incoming && REQUEST_ID.test(incoming) ? incoming : randomUUID()
  const started = process.hrtime.bigint()
  request.requestId = requestId
  response.locals.request_id = requestId
  response.setHeader('X-Request-ID', requestId)

  const originalJson = response.json.bind(response)
  response.json = ((body: unknown) => {
    if (response.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      if (response.statusCode >= 500) return originalJson({ message: 'Internal server error', request_id: requestId })
      return originalJson({ ...(body as object), request_id: requestId })
    }
    return originalJson(body)
  }) as Response['json']

  response.on('finish', () => {
    const user = (request as RequestWithContext & { user?: { id?: string; roles?: string[]; school_id?: string | null } }).user
    const duration = Number(process.hrtime.bigint() - started) / 1_000_000
    const status = response.statusCode
    structuredLog(status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', {
      request_id: requestId,
      method: request.method,
      route: request.originalUrl?.split('?')[0],
      status,
      duration_ms: Number(duration.toFixed(2)),
      user_id: user?.id,
      role: user?.roles?.[0],
      school_id: user?.school_id,
      ip: maskIp(request.ip || request.socket.remoteAddress || ''),
      action: response.locals.security_action ?? 'http_request',
      result: status >= 500 ? 'error' : status >= 400 ? 'denied' : 'success',
    })
  })
  next()
}
