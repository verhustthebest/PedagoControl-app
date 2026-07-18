const test = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const prisma = require('../dist/prisma/client').default
const sessions = require('../dist/services/auth-session.service')
const { signAccessToken } = require('../dist/services/auth.service')

const strongSecret = 'Access-Session-Test-Secret-2026!Strong#Alpha'
const request = (cookie = '', origin = 'https://frontend.example') => ({
  ip: '127.0.0.1', socket: {},
  header(name) { return ({ cookie, origin, 'user-agent': 'test-agent' })[name.toLowerCase()] },
})
const response = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value } })

async function env(callback) {
  const previous = { ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET, FRONTEND_URLS: process.env.FRONTEND_URLS, NODE_ENV: process.env.NODE_ENV }
  Object.assign(process.env, { ACCESS_TOKEN_SECRET: strongSecret, FRONTEND_URLS: 'https://frontend.example', NODE_ENV: 'test' })
  try { return await callback() } finally {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value
  }
}

function mockMethods(replacements, callback) {
  const originals = []
  for (const [path, replacement] of Object.entries(replacements)) {
    const [owner, method] = path.split('.')
    const target = owner === 'prisma' ? prisma : prisma[owner]
    originals.push([target, method, target[method]])
    target[method] = replacement
  }
  return Promise.resolve().then(callback).finally(() => originals.forEach(([target, method, original]) => { target[method] = original }))
}

test('session creation stores only hashes and produces an HttpOnly cookie', async () => env(async () => {
  let stored
  await mockMethods({ 'auth_sessions.create': async ({ data }) => { stored = data; return { id: 'c60f813c-5dea-4f03-a14f-b672825041e5' } } }, async () => {
    const created = await sessions.createAuthSession('42', request())
    assert.equal(stored.refresh_token_hash.length, 64)
    assert.equal(stored.csrf_token_hash.length, 64)
    assert.equal(created.refreshToken.includes(stored.refresh_token_hash), false)
    const res = response()
    sessions.setRefreshCookie(res, created.refreshToken, created.expiresAt)
    assert.match(res.headers['Set-Cookie'], /HttpOnly/)
    assert.match(res.headers['Set-Cookie'], /Path=\/api\/auth/)
    assert.equal(JSON.stringify({ accessToken: 'jwt', csrfToken: created.csrfToken }).includes(created.refreshToken), false)
  })
}))

test('missing refresh cookie and unknown origin are refused by prerequisites', () => env(() => {
  assert.equal(sessions.readRefreshCookie(request()), null)
  assert.equal(sessions.requestOriginAllowed(request('', 'https://evil.example')), false)
  assert.equal(sessions.requestOriginAllowed(request('', 'https://frontend.example')), true)
}))

test('CSRF missing or incorrect prevents rotation', async () => env(async () => {
  let stored
  await mockMethods({
    'auth_sessions.create': async ({ data }) => { stored = data; return { id: 'c60f813c-5dea-4f03-a14f-b672825041e5' } },
    'auth_sessions.findUnique': async () => ({ id: 'c60f813c-5dea-4f03-a14f-b672825041e5', user_id: 42n, ...stored, revoked_at: null }),
  }, async () => {
    const created = await sessions.createAuthSession('42', request())
    await assert.rejects(() => sessions.rotateRefreshToken(created.refreshToken, 'wrong-token'), sessions.SessionError)
  })
}))

test('refresh rotates both secrets and reuse revokes the session', async () => env(async () => {
  let record
  let revoked = false
  await mockMethods({
    'auth_sessions.create': async ({ data }) => { record = { id: 'c60f813c-5dea-4f03-a14f-b672825041e5', user_id: 42n, ...data, revoked_at: null }; return record },
    'auth_sessions.findUnique': async () => record,
    'prisma.$transaction': async callback => callback({ auth_sessions: { updateMany: async ({ data }) => { Object.assign(record, data); return { count: 1 } } } }),
    'auth_sessions.updateMany': async ({ data }) => { Object.assign(record, data); revoked = Boolean(data.revoked_at); return { count: 1 } },
  }, async () => {
    const created = await sessions.createAuthSession('42', request())
    const rotated = await sessions.rotateRefreshToken(created.refreshToken, created.csrfToken)
    assert.notEqual(rotated.refreshToken, created.refreshToken)
    assert.notEqual(rotated.csrfToken, created.csrfToken)
    await assert.rejects(() => sessions.rotateRefreshToken(created.refreshToken, created.csrfToken), sessions.SessionError)
    assert.equal(revoked, true)
  })
}))

test('expired and revoked sessions cannot be refreshed', async () => env(async () => {
  for (const record of [
    { revoked_at: new Date(), expires_at: new Date(Date.now() + 60_000) },
    { revoked_at: null, expires_at: new Date(Date.now() - 1) },
  ]) {
    await mockMethods({ 'auth_sessions.findUnique': async () => ({ id: 'c60f813c-5dea-4f03-a14f-b672825041e5', user_id: 42n, refresh_token_hash: '0'.repeat(64), csrf_token_hash: '0'.repeat(64), ...record }) }, async () => {
      await assert.rejects(() => sessions.issueCsrfToken('c60f813c-5dea-4f03-a14f-b672825041e5.' + 'a'.repeat(43)), sessions.SessionError)
    })
  }
}))

test('logout cookie expires immediately and logout-all revokes every user session', async () => env(async () => {
  const res = response()
  sessions.clearRefreshCookie(res)
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/)
  let where
  await mockMethods({ 'auth_sessions.updateMany': async input => { where = input.where; return { count: 2 } } }, () => sessions.revokeAllUserSessions('42'))
  assert.equal(where.user_id, 42n)
}))

test('access token contains the persistent session sid', () => env(() => {
  const token = signAccessToken({ id: '42', email: 'u@example.com', first_name: 'U', last_name: 'T', school_id: '1', roles: ['ENSEIGNANT'], permissions: [] }, 'c60f813c-5dea-4f03-a14f-b672825041e5')
  assert.equal(jwt.decode(token).sid, 'c60f813c-5dea-4f03-a14f-b672825041e5')
}))
