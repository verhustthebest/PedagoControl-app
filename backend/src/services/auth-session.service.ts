import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import type { Request, Response } from 'express'
import prisma from '../prisma/client'
import { accessTokenSecret } from '../config/token-security'
import { frontendOrigins } from '../config/http'

export class SessionError extends Error {}
export class SessionReuseError extends SessionError {}

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const opaque = () => randomBytes(32).toString('base64url')
const ttlDays = () => {
  const value = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30)
  return Number.isInteger(value) && value > 0 && value <= 365 ? value : 30
}
const shortTtlHours = () => {
  const value = Number(process.env.SESSION_REFRESH_TTL_HOURS ?? 8)
  return Number.isInteger(value) && value > 0 && value <= 24 ? value : 8
}
export const refreshCookieName = () => process.env.REFRESH_COOKIE_NAME || 'pedago_refresh'

function secureCookie() {
  return process.env.NODE_ENV === 'production' || process.env.REFRESH_COOKIE_SECURE === 'true'
}

function sameSite() {
  const configured = (process.env.REFRESH_COOKIE_SAME_SITE ?? (process.env.NODE_ENV === 'production' ? 'none' : 'lax')).toLowerCase()
  if (!['strict', 'lax', 'none'].includes(configured)) return 'Lax'
  if (configured === 'none' && !secureCookie()) return 'Lax'
  return configured[0].toUpperCase() + configured.slice(1)
}

function cookie(value: string, maxAge: number) {
  return `${refreshCookieName()}=${value}; Path=/api/auth; HttpOnly; SameSite=${sameSite()}; Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}${secureCookie() ? '; Secure' : ''}`
}

export function setRefreshCookie(response: Response, token: string, expiresAt: Date) {
  response.setHeader('Set-Cookie', cookie(token, expiresAt.getTime() - Date.now()))
}

export function clearRefreshCookie(response: Response) {
  response.setHeader('Set-Cookie', cookie('', 0))
}

export function readRefreshCookie(request: Request) {
  const raw = request.header('cookie') ?? ''
  for (const entry of raw.split(';')) {
    const [name, ...parts] = entry.trim().split('=')
    if (name === refreshCookieName()) return parts.join('=') || null
  }
  return null
}

export function parseRefreshToken(token: string) {
  const separator = token.indexOf('.')
  if (separator <= 0) throw new SessionError()
  const sessionId = token.slice(0, separator)
  const secret = token.slice(separator + 1)
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || secret.length < 40) throw new SessionError()
  return { sessionId, secret }
}

function safeHashMatch(value: string, expected: string) {
  const actual = Buffer.from(hash(value), 'hex')
  const stored = Buffer.from(expected, 'hex')
  return actual.length === stored.length && timingSafeEqual(actual, stored)
}

function metadata(request: Request) {
  const ip = request.ip || request.socket.remoteAddress || ''
  const agent = request.header('user-agent') ?? ''
  return {
    ip_address_hash: ip ? createHmac('sha256', String(accessTokenSecret())).update(ip).digest('hex') : null,
    user_agent_summary: agent ? hash(agent).slice(0, 64) : null,
  }
}

export function requestOriginAllowed(request: Request) {
  const raw = request.header('origin') || request.header('referer')
  if (!raw) return false
  try { return frontendOrigins().has(new URL(raw).origin) } catch { return false }
}

export async function createAuthSession(userId: string, request: Request, persistent = true) {
  const refreshSecret = opaque()
  const csrfToken = opaque()
  const expiresAt = new Date(Date.now() + (persistent ? ttlDays() * 86_400_000 : shortTtlHours() * 3_600_000))
  const session = await prisma.auth_sessions.create({ data: {
    user_id: BigInt(userId), refresh_token_hash: hash(refreshSecret), csrf_token_hash: hash(csrfToken),
    expires_at: expiresAt, ...metadata(request),
  } })
  return { sessionId: session.id, refreshToken: `${session.id}.${refreshSecret}`, csrfToken, expiresAt }
}

async function activeSession(token: string) {
  const parsed = parseRefreshToken(token)
  const session = await prisma.auth_sessions.findUnique({ where: { id: parsed.sessionId } })
  if (!session || session.revoked_at || session.expires_at.getTime() <= Date.now()) throw new SessionError()
  if (!safeHashMatch(parsed.secret, session.refresh_token_hash)) {
    await prisma.auth_sessions.updateMany({ where: { id: parsed.sessionId, revoked_at: null }, data: { revoked_at: new Date() } })
    throw new SessionReuseError()
  }
  return { session, parsed }
}

export async function issueCsrfToken(refreshToken: string) {
  const { session } = await activeSession(refreshToken)
  const csrfToken = opaque()
  await prisma.auth_sessions.update({ where: { id: session.id }, data: { csrf_token_hash: hash(csrfToken), last_used_at: new Date() } })
  return { sessionId: session.id, userId: session.user_id.toString(), csrfToken }
}

export async function rotateRefreshToken(refreshToken: string, csrfToken: string) {
  const { session, parsed } = await activeSession(refreshToken)
  if (!safeHashMatch(csrfToken, session.csrf_token_hash)) throw new SessionError()
  const nextSecret = opaque()
  const nextCsrf = opaque()
  const updated = await prisma.$transaction(transaction => transaction.auth_sessions.updateMany({
    where: { id: session.id, refresh_token_hash: hash(parsed.secret), revoked_at: null, expires_at: { gt: new Date() } },
    data: { refresh_token_hash: hash(nextSecret), csrf_token_hash: hash(nextCsrf), last_used_at: new Date() },
  }))
  if (updated.count !== 1) {
    await revokeSession(session.id)
    throw new SessionError()
  }
  return { sessionId: session.id, userId: session.user_id.toString(), refreshToken: `${session.id}.${nextSecret}`, csrfToken: nextCsrf, expiresAt: session.expires_at }
}

export async function assertActiveSession(sessionId: string, userId: string) {
  const session = await prisma.auth_sessions.findFirst({ where: { id: sessionId, user_id: BigInt(userId), revoked_at: null, expires_at: { gt: new Date() } }, select: { id: true } })
  return Boolean(session)
}

export async function revokeSession(sessionId: string) {
  await prisma.auth_sessions.updateMany({ where: { id: sessionId, revoked_at: null }, data: { revoked_at: new Date() } })
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.auth_sessions.updateMany({ where: { user_id: BigInt(userId), revoked_at: null }, data: { revoked_at: new Date() } })
}

export async function revokeSessionsForSchool(schoolId: string) {
  await prisma.auth_sessions.updateMany({ where: { users: { school_id: BigInt(schoolId) }, revoked_at: null }, data: { revoked_at: new Date() } })
}
