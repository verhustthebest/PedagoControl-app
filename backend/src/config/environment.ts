import { validateTokenConfiguration } from './token-security'

export function validateRuntimeEnvironment(environment = process.env.NODE_ENV) {
  validateTokenConfiguration()
  if (environment !== 'production') return
  for (const name of ['DATABASE_URL', 'FRONTEND_URLS']) {
    if (!process.env[name]?.trim()) throw new Error(`${name} is required in production`)
  }
  if (process.env.JWT_SECRET) throw new Error('JWT_SECRET fallback is forbidden in production')
}
