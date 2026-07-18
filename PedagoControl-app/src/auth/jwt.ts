export type JwtStatus = 'missing' | 'invalid' | 'expired' | 'valid'

function decodePayload(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(globalThis.atob(padded)) as { exp?: unknown }
  } catch {
    return null
  }
}

export function jwtStatus(token: string | null, nowSeconds = Date.now() / 1000): JwtStatus {
  if (!token) return 'missing'
  const payload = decodePayload(token)
  if (!payload || typeof payload.exp !== 'number') return 'invalid'
  return payload.exp > nowSeconds ? 'valid' : 'expired'
}
