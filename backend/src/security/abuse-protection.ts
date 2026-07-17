import { createHash, randomInt } from 'crypto'

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Too many requests')
    this.name = 'RateLimitError'
  }
}

type Entry = { timestamps: number[]; failures: number }

export class SlidingWindowLimiter {
  private readonly entries = new Map<string, Entry>()

  constructor(
    private readonly maximum: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string) {
    const now = this.now()
    const entry = this.entries.get(key) ?? { timestamps: [], failures: 0 }
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > now - this.windowMs)
    if (entry.timestamps.length >= this.maximum) {
      const retryAfterMs = Math.max(1, entry.timestamps[0] + this.windowMs - now)
      this.entries.set(key, entry)
      return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
    }
    entry.timestamps.push(now)
    this.entries.set(key, entry)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  failures(key: string) {
    return this.entries.get(key)?.failures ?? 0
  }

  recordFailure(key: string) {
    const entry = this.entries.get(key) ?? { timestamps: [], failures: 0 }
    entry.failures += 1
    this.entries.set(key, entry)
    return entry.failures
  }

  forgive(key: string, count = 1) {
    const entry = this.entries.get(key)
    if (!entry) return
    entry.failures = Math.max(0, entry.failures - count)
    entry.timestamps.splice(0, Math.min(count, entry.timestamps.length))
    if (!entry.failures && !entry.timestamps.length) this.entries.delete(key)
  }

  reset() {
    this.entries.clear()
  }
}

function positiveInteger(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

export function normalizeIdentifier(value: unknown) {
  if (typeof value !== 'string') return 'missing'
  const normalized = value.trim().toLowerCase()
  if (!normalized) return 'missing'
  if (normalized.includes('@')) return normalized
  return normalized.replace(/[\s().-]/g, '').replace(/^00/, '+')
}

export function maskContact(value: string) {
  const normalized = normalizeIdentifier(value)
  if (normalized.includes('@')) {
    const [local, domain] = normalized.split('@')
    return `${local.slice(0, 2)}***@${domain}`
  }
  return normalized.length <= 4 ? '***' : `${normalized.slice(0, 3)}***${normalized.slice(-2)}`
}

export function opaqueNumericId() {
  return `${Date.now()}${randomInt(100_000, 999_999)}`
}

export function publicOtpRequestResponse(verificationId?: string, expiresInSeconds = 600) {
  return {
    message: 'If the information is eligible, a verification code will be sent.',
    verification_id: verificationId ?? opaqueNumericId(),
    expires_in_seconds: expiresInSeconds,
  }
}

export function fingerprint(value: unknown) {
  return createHash('sha256').update(typeof value === 'string' ? value : 'missing').digest('hex').slice(0, 24)
}

export class LoginAbuseGuard {
  private readonly ipLimiter: SlidingWindowLimiter
  private readonly identifierLimiter: SlidingWindowLimiter

  constructor(
    options: {
      ipMax?: number
      identifierMax?: number
      windowMs?: number
      now?: () => number
      delayThreshold?: number
      delayBaseMs?: number
      delayMaxMs?: number
    } = {},
  ) {
    const windowMs = options.windowMs ?? positiveInteger('LOGIN_RATE_WINDOW_MINUTES', 15) * 60_000
    this.ipLimiter = new SlidingWindowLimiter(options.ipMax ?? positiveInteger('LOGIN_RATE_IP_MAX', 20), windowMs, options.now)
    this.identifierLimiter = new SlidingWindowLimiter(options.identifierMax ?? positiveInteger('LOGIN_RATE_IDENTIFIER_MAX', 8), windowMs, options.now)
    this.delayThreshold = options.delayThreshold ?? positiveInteger('LOGIN_DELAY_THRESHOLD', 3)
    this.delayBaseMs = options.delayBaseMs ?? positiveInteger('LOGIN_DELAY_BASE_MS', 250)
    this.delayMaxMs = options.delayMaxMs ?? positiveInteger('LOGIN_DELAY_MAX_MS', 4000)
  }

  private readonly delayThreshold: number
  private readonly delayBaseMs: number
  private readonly delayMaxMs: number

  begin(ip: string, identifier: string) {
    const ipResult = this.ipLimiter.consume(`ip:${ip}`)
    const identifierResult = this.identifierLimiter.consume(`id:${identifier}`)
    if (!ipResult.allowed || !identifierResult.allowed) {
      throw new RateLimitError(Math.max(ipResult.retryAfterSeconds, identifierResult.retryAfterSeconds))
    }
  }

  failed(ip: string, identifier: string) {
    this.ipLimiter.recordFailure(`ip:${ip}`)
    const failures = this.identifierLimiter.recordFailure(`id:${identifier}`)
    if (failures < this.delayThreshold) return 0
    return Math.min(this.delayMaxMs, this.delayBaseMs * 2 ** (failures - this.delayThreshold))
  }

  succeeded(ip: string, identifier: string) {
    this.ipLimiter.forgive(`ip:${ip}`, 1)
    this.identifierLimiter.forgive(`id:${identifier}`, 2)
  }
}

export class OtpAbuseGuard {
  private readonly hour: SlidingWindowLimiter
  private readonly day: SlidingWindowLimiter
  private readonly verify: SlidingWindowLimiter
  private readonly registration: SlidingWindowLimiter

  constructor(options: { now?: () => number; hourMax?: number; dayMax?: number; verifyMax?: number } = {}) {
    this.hour = new SlidingWindowLimiter(options.hourMax ?? positiveInteger('OTP_REQUEST_MAX_PER_HOUR', 4), 60 * 60_000, options.now)
    this.day = new SlidingWindowLimiter(options.dayMax ?? positiveInteger('OTP_REQUEST_MAX_PER_DAY', 10), 24 * 60 * 60_000, options.now)
    this.verify = new SlidingWindowLimiter(options.verifyMax ?? positiveInteger('OTP_VERIFY_MAX_ATTEMPTS', 5), positiveInteger('OTP_VERIFY_WINDOW_MINUTES', 15) * 60_000, options.now)
    this.registration = new SlidingWindowLimiter(positiveInteger('PARENT_REGISTRATION_MAX_PER_HOUR', 5), 60 * 60_000, options.now)
  }

  request(keys: string[]) {
    let retryAfter = 0
    for (const key of keys) {
      const hourly = this.hour.consume(key)
      const daily = this.day.consume(key)
      if (!hourly.allowed || !daily.allowed) retryAfter = Math.max(retryAfter, hourly.retryAfterSeconds, daily.retryAfterSeconds)
    }
    if (retryAfter) throw new RateLimitError(retryAfter)
  }

  verification(keys: string[]) {
    let retryAfter = 0
    for (const key of keys) {
      const result = this.verify.consume(key)
      if (!result.allowed) retryAfter = Math.max(retryAfter, result.retryAfterSeconds)
    }
    if (retryAfter) throw new RateLimitError(retryAfter)
  }

  registrationAttempt(keys: string[]) {
    let retryAfter = 0
    for (const key of keys) {
      const result = this.registration.consume(key)
      if (!result.allowed) retryAfter = Math.max(retryAfter, result.retryAfterSeconds)
    }
    if (retryAfter) throw new RateLimitError(retryAfter)
  }
}

export const loginAbuseGuard = new LoginAbuseGuard()
export const otpAbuseGuard = new OtpAbuseGuard()

export function wait(milliseconds: number) {
  return milliseconds > 0 ? new Promise((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve()
}
