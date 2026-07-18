const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const { Prisma } = require('@prisma/client')
const { requestContext, redact, maskEmail, maskPhone, maskIp, structuredLog } = require('../dist/middleware/request-context.middleware')
const { globalErrorHandler } = require('../dist/middleware/error.middleware')
const { validateRuntimeEnvironment } = require('../dist/config/environment')
const { assertSeedAllowed } = require('../dist/seed/seed-security')

async function serverFor(error, callback) {
  const app = express()
  app.use(requestContext)
  app.get('/failure', (_request, _response, next) => next(error))
  app.use(globalErrorHandler)
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
  try { await callback(`http://127.0.0.1:${server.address().port}`) } finally { await new Promise(resolve => server.close(resolve)) }
}

test('500 response is generic, contains request_id, and exposes no stack or path', async () => {
  await serverFor(new Error('secret at C:\\internal\\server.ts DATABASE_URL=hidden'), async base => {
    const response = await fetch(`${base}/failure`, { headers: { 'X-Request-ID': 'valid-request-123' } })
    const body = await response.json()
    assert.equal(response.status, 500)
    assert.equal(body.message, 'Internal server error')
    assert.equal(body.request_id, 'valid-request-123')
    assert.equal(response.headers.get('x-request-id'), 'valid-request-123')
    assert.equal(JSON.stringify(body).includes('internal'), false)
    assert.equal('stack' in body, false)
  })
})

test('Prisma errors and SQL details are never exposed', async () => {
  const error = new Prisma.PrismaClientKnownRequestError('SELECT * FROM users; password=secret', { code: 'P2002', clientVersion: 'test' })
  await serverFor(error, async base => {
    const body = await fetch(`${base}/failure`).then(response => response.json())
    assert.deepEqual(Object.keys(body).sort(), ['message', 'request_id'])
    assert.equal(JSON.stringify(body).includes('P2002'), false)
    assert.equal(JSON.stringify(body).includes('SELECT'), false)
  })
})

test('invalid incoming request IDs are replaced', async () => {
  await serverFor(Object.assign(new Error('forbidden'), { statusCode: 403 }), async base => {
    const response = await fetch(`${base}/failure`, { headers: { 'X-Request-ID': '../../bad' } })
    const body = await response.json()
    assert.equal(response.status, 403)
    assert.equal(body.message, 'Access forbidden')
    assert.notEqual(body.request_id, '../../bad')
    assert.match(body.request_id, /^[0-9a-f-]{36}$/)
  })
})

test('structured logs redact secrets, passwords, OTP, JWT, cookies and CSRF', () => {
  const lines = []
  const original = console.warn
  console.warn = line => lines.push(String(line))
  try {
    structuredLog('warn', { password: 'Password123!', otp: '123456', jwt: 'eyJ.secret', refresh_token: 'refresh', cookie: 'sid=secret', csrfToken: 'csrf', email: 'person@example.com', phone: '+243999123456' })
  } finally { console.warn = original }
  const output = lines.join('')
  for (const secret of ['Password123!', '123456', 'eyJ.secret', 'sid=secret', '+243999123456']) assert.equal(output.includes(secret), false)
  assert.match(output, /\[redacted\]/)
})

test('personal data masking is deterministic and partial', () => {
  assert.equal(maskEmail('person@example.com'), 'pe***@example.com')
  assert.equal(maskPhone('+243999123456'), '***3456')
  assert.equal(maskIp('192.168.1.25'), '192.168.*.*')
  assert.equal(redact({ email: 'person@example.com', phone: '+243999123456' }).email, 'pe***@example.com')
})

test('production refuses missing critical environment and demo seeds', () => {
  const previous = { ...process.env }
  Object.assign(process.env, {
    NODE_ENV: 'production',
    ACCESS_TOKEN_SECRET: 'Access-Token-Secret-2026!Strong#Value-Alpha',
    PARENT_REGISTRATION_TOKEN_SECRET: 'Parent-Registration-Secret-2026!Strong#Beta',
    PASSWORD_RESET_TOKEN_SECRET: 'Reset-Credential-2026!Strong#Value-Gamma-Delta',
    DATABASE_URL: '', FRONTEND_URLS: '', JWT_SECRET: '',
  })
  try {
    assert.throws(() => validateRuntimeEnvironment('production'), /DATABASE_URL/)
    assert.throws(() => assertSeedAllowed('demo', 'production'), /disabled/)
  } finally { process.env = previous }
})
