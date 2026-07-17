const test = require('node:test')
const assert = require('node:assert/strict')
const {
  LoginAbuseGuard,
  normalizeIdentifier,
  OtpAbuseGuard,
  publicOtpRequestResponse,
  RateLimitError,
} = require('../dist/security/abuse-protection.js')
const { resolveTrustProxyHops } = require('../dist/config/network.js')
const express = require('express')

test('repeated login attempts are blocked with 429 semantics', () => {
  const guard = new LoginAbuseGuard({ ipMax: 3, identifierMax: 3, delayBaseMs: 0 })
  guard.begin('10.0.0.1', 'parent@example.com')
  guard.failed('10.0.0.1', 'parent@example.com')
  guard.begin('10.0.0.1', 'parent@example.com')
  guard.failed('10.0.0.1', 'parent@example.com')
  guard.begin('10.0.0.1', 'parent@example.com')
  assert.throws(() => guard.begin('10.0.0.1', 'parent@example.com'), RateLimitError)
})

test('another IP does not restore the targeted identifier quota', () => {
  const guard = new LoginAbuseGuard({ ipMax: 10, identifierMax: 2, delayBaseMs: 0 })
  guard.begin('10.0.0.1', 'target@example.com')
  guard.begin('10.0.0.2', 'target@example.com')
  assert.throws(() => guard.begin('10.0.0.3', 'target@example.com'), RateLimitError)
})

test('a successful login is accepted after the blocking window expires', () => {
  let now = 0
  const guard = new LoginAbuseGuard({ ipMax: 1, identifierMax: 1, windowMs: 1000, now: () => now, delayBaseMs: 0 })
  guard.begin('10.0.0.1', 'user@example.com')
  assert.throws(() => guard.begin('10.0.0.1', 'user@example.com'), RateLimitError)
  now = 1001
  assert.doesNotThrow(() => guard.begin('10.0.0.1', 'user@example.com'))
  guard.succeeded('10.0.0.1', 'user@example.com')
})

test('repeated OTP requests are blocked independently by contact and school', () => {
  const guard = new OtpAbuseGuard({ hourMax: 2, dayMax: 3 })
  const keys = ['otp-ip:1', 'otp-contact:parent@example.com', 'otp-school:school-a']
  guard.request(keys)
  guard.request(keys)
  assert.throws(() => guard.request(keys), RateLimitError)
})

test('incorrect OTP verification attempts are limited', () => {
  const guard = new OtpAbuseGuard({ verifyMax: 2 })
  guard.verification(['verify-ip:1', 'verify-id:abc'])
  guard.verification(['verify-ip:1', 'verify-id:abc'])
  assert.throws(() => guard.verification(['verify-ip:1', 'verify-id:abc']), RateLimitError)
})

test('normalization produces the same public lookup key for equivalent identifiers', () => {
  assert.equal(normalizeIdentifier(' Parent@Example.COM '), 'parent@example.com')
  assert.equal(normalizeIdentifier('(+243) 81-234-56-78'), '+243812345678')
})

test('existing and nonexistent parents receive the same public OTP response shape', () => {
  const existing = publicOtpRequestResponse('123', 600)
  const nonexistent = publicOtpRequestResponse(undefined, 600)
  assert.equal(existing.message, nonexistent.message)
  assert.deepEqual(Object.keys(existing).sort(), Object.keys(nonexistent).sort())
  assert.equal(existing.expires_in_seconds, nonexistent.expires_in_seconds)
})

test('Heroku trusts one proxy hop while local development trusts none', () => {
  assert.equal(resolveTrustProxyHops('production', undefined), 1)
  assert.equal(resolveTrustProxyHops('development', undefined), 0)
  assert.equal(resolveTrustProxyHops('production', '1'), 1)
  assert.throws(() => resolveTrustProxyHops('production', '100'))
})

test('one trusted Heroku proxy ignores a client-supplied earlier IP hop', async () => {
  const app = express()
  app.set('trust proxy', resolveTrustProxyHops('production', undefined))
  app.get('/ip', (request, response) => response.json({ ip: request.ip }))
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    const address = server.address()
    const response = await fetch(`http://127.0.0.1:${address.port}/ip`, {
      headers: { 'x-forwarded-for': '198.51.100.99, 203.0.113.10' },
    })
    const body = await response.json()
    assert.equal(body.ip, '203.0.113.10')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
