import cors, { type CorsOptions } from 'cors'
import type { NextFunction, Request, Response } from 'express'
import express, { type Express } from 'express'
import helmet from 'helmet'

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
const HEADERS = ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With']

export function frontendOrigins(environment = process.env.NODE_ENV, configured = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL) {
  const origins = new Set((configured ?? '').split(',').map(value => value.trim()).filter(Boolean))
  if (environment !== 'production') {
    origins.add('http://localhost:5173')
    origins.add('http://127.0.0.1:5173')
  }
  return origins
}

export function corsOptions(environment = process.env.NODE_ENV, configured = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL): CorsOptions {
  const allowed = frontendOrigins(environment, configured)
  return {
    credentials: true,
    methods: METHODS,
    allowedHeaders: HEADERS,
    optionsSuccessStatus: 204,
    maxAge: 600,
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) return callback(null, true)
      return callback(Object.assign(new Error('Origin not allowed'), { statusCode: 403 }))
    },
  }
}

function positiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

export function shouldForceHttps(environment = process.env.NODE_ENV, configured = process.env.FORCE_HTTPS) {
  return environment === 'production' && configured !== 'false'
}

export function httpsBoundary(request: Request, response: Response, next: NextFunction) {
  if (!shouldForceHttps() || request.secure) return next()
  return response.redirect(308, `https://${request.get('host')}${request.originalUrl}`)
}

export function sensitiveNoStore(request: Request, response: Response, next: NextFunction) {
  if (/^\/api\/(?:auth(?:\/|$)|parental\/auth(?:\/|$))/.test(request.path)) {
    response.setHeader('Cache-Control', 'no-store')
  }
  next()
}

export function configureHttpBoundary(app: Express) {
  app.disable('x-powered-by')
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"],
    } },
    hsts: false,
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
  }))
  app.use((_request, response, next) => {
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
    next()
  })
  app.use(httpsBoundary)
  app.use((request, response, next) => {
    if (process.env.NODE_ENV === 'production' && request.secure) {
      response.setHeader('Strict-Transport-Security', `max-age=${positiveInteger(process.env.HSTS_MAX_AGE, 31536000)}; includeSubDomains`)
    }
    next()
  })
  app.use(cors(corsOptions()))
  app.options(/.*/, cors(corsOptions()))
  app.use(sensitiveNoStore)
  app.use((request, response, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && Number(request.get('content-length') ?? 0) > 0 && !request.is('application/json')) {
      return response.status(415).json({ message: 'Unsupported media type' })
    }
    next()
  })
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? '256kb', type: 'application/json' }))
}

export function httpErrorHandler(error: unknown, _request: Request, response: Response, next: NextFunction) {
  const candidate = error as { type?: string; status?: number; statusCode?: number }
  if (candidate?.type === 'entity.too.large' || candidate?.status === 413) {
    return response.status(413).json({ message: 'Request body too large' })
  }
  if (candidate?.statusCode === 403) return response.status(403).json({ message: 'Origin not allowed' })
  return next(error)
}
