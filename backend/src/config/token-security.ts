import type { Secret } from 'jsonwebtoken'

export const ACCESS_TOKEN_ALGORITHM = 'HS256' as const
export const ACCESS_TOKEN_ISSUER = () => process.env.ACCESS_TOKEN_ISSUER ?? 'pedago-control-api'
export const ACCESS_TOKEN_AUDIENCE = () => process.env.ACCESS_TOKEN_AUDIENCE ?? 'pedago-control-frontend'
export const ACCESS_TOKEN_TTL = () => process.env.ACCESS_TOKEN_TTL ?? '15m'
export const PARENT_TOKEN_ISSUER = 'pedago-control-parent-registration'
export const PARENT_TOKEN_AUDIENCE = 'pedago-control-parent-registration-action'

const warned = new Set<string>()

export function isStrongTokenSecret(secret: string | undefined) {
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) return false
  if (/^(.)\1+$/.test(secret) || /^(password|secret|changeme|development)/i.test(secret)) return false
  return new Set(secret).size >= 12
}

function secret(name: 'ACCESS_TOKEN_SECRET' | 'PARENT_REGISTRATION_TOKEN_SECRET' | 'PASSWORD_RESET_TOKEN_SECRET'): Secret {
  const configured = process.env[name]
  if (isStrongTokenSecret(configured)) return configured as string
  if (process.env.NODE_ENV !== 'production' && isStrongTokenSecret(process.env.JWT_SECRET)) {
    if (!warned.has(name)) {
      warned.add(name)
      console.warn(`[SECURITY] ${name} uses the temporary development JWT_SECRET fallback`)
    }
    return process.env.JWT_SECRET as string
  }
  throw new Error(`${name} is missing or too weak`)
}

export const accessTokenSecret = () => secret('ACCESS_TOKEN_SECRET')
export const parentRegistrationTokenSecret = () => secret('PARENT_REGISTRATION_TOKEN_SECRET')
export const passwordResetTokenSecret = () => secret('PASSWORD_RESET_TOKEN_SECRET')

export function validateTokenConfiguration() {
  const access = accessTokenSecret()
  const parent = parentRegistrationTokenSecret()
  const reset = passwordResetTokenSecret()
  if (process.env.NODE_ENV === 'production' && (access === parent || access === reset || parent === reset)) {
    throw new Error('Token secrets must be distinct in production')
  }
}
