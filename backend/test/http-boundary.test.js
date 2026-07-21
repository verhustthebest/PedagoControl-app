const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const { configureHttpBoundary, httpErrorHandler } = require('../dist/config/http')

async function withServer(environment, values, callback) {
  const previous = { ...process.env }
  Object.assign(process.env, values, { NODE_ENV: environment })
  const app = express()
  app.set('trust proxy', environment === 'production' ? 1 : 0)
  configureHttpBoundary(app)
  app.get('/api/check', (_request, response) => response.json({ ok: true }))
  app.post('/api/echo', (request, response) => response.json(request.body))
  app.post('/api/auth/login', (_request, response) => response.json({ ok: true }))
  app.post('/api/auth/refresh', (_request, response) => response.json({ ok: true }))
  app.post('/api/parental/auth/request-otp', (_request, response) => response.json({ ok: true }))
  app.use(httpErrorHandler)
  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance))
  })
  try {
    const address = server.address()
    await callback(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise(resolve => server.close(resolve))
    process.env = previous
  }
}

test('Helmet applies API security headers and removes X-Powered-By', async () => {
  await withServer('development', { FRONTEND_URLS: 'https://frontend.example' }, async base => {
    const response = await fetch(`${base}/api/check`)
    assert.equal(response.headers.get('x-powered-by'), null)
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/)
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/)
    assert.equal(response.headers.get('x-frame-options'), 'DENY')
    assert.match(response.headers.get('permissions-policy'), /camera=\(\)/)
  })
})

test('CORS accepts configured origins and rejects unknown origins', async () => {
  await withServer('production', { FRONTEND_URLS: 'https://one.example, https://two.example', FORCE_HTTPS: 'false' }, async base => {
    const accepted = await fetch(`${base}/api/check`, { headers: { Origin: 'https://two.example' } })
    assert.equal(accepted.headers.get('access-control-allow-origin'), 'https://two.example')
    assert.equal(accepted.headers.get('access-control-allow-credentials'), 'true')
    const rejected = await fetch(`${base}/api/check`, { headers: { Origin: 'https://unknown.example' } })
    assert.equal(rejected.status, 403)
  })
})

test('localhost is accepted only outside production', async () => {
  await withServer('development', { FRONTEND_URLS: '' }, async base => {
    const response = await fetch(`${base}/api/check`, { headers: { Origin: 'http://localhost:5173' } })
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  })
  await withServer('production', { FRONTEND_URLS: 'https://frontend.example', FORCE_HTTPS: 'false' }, async base => {
    const response = await fetch(`${base}/api/check`, { headers: { Origin: 'http://localhost:5173' } })
    assert.equal(response.status, 403)
  })
})

test('OPTIONS preflight returns explicit methods and headers', async () => {
  await withServer('development', { FRONTEND_URLS: 'https://frontend.example' }, async base => {
    const response = await fetch(`${base}/api/echo`, { method: 'OPTIONS', headers: { Origin: 'https://frontend.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } })
    assert.equal(response.status, 204)
    assert.match(response.headers.get('access-control-allow-methods'), /POST/)
    assert.match(response.headers.get('access-control-allow-headers').toLowerCase(), /authorization/)
  })
})

test('auth refresh preflight accepts the configured CSRF header', async () => {
  await withServer('development', { FRONTEND_URLS: 'https://frontend.example', CSRF_HEADER_NAME: 'X-CSRF-Token' }, async base => {
    const response = await fetch(`${base}/api/auth/refresh`, { method: 'OPTIONS', headers: { Origin: 'https://frontend.example', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,authorization,x-csrf-token' } })
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://frontend.example')
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true')
    const headers = response.headers.get('access-control-allow-headers').toLowerCase()
    for (const expected of ['content-type', 'authorization', 'x-csrf-token']) assert.match(headers, new RegExp(expected))
    assert.notEqual(response.headers.get('access-control-allow-origin'), '*')
  })
})

test('oversized JSON bodies receive a generic 413', async () => {
  await withServer('development', { JSON_BODY_LIMIT: '1kb' }, async base => {
    const response = await fetch(`${base}/api/echo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(2000) }) })
    assert.equal(response.status, 413)
    assert.deepEqual(await response.json(), { message: 'Request body too large' })
  })
})

test('production redirects HTTP once and accepts HTTPS reported by the trusted proxy', async () => {
  await withServer('production', { FORCE_HTTPS: 'true', FRONTEND_URLS: 'https://frontend.example' }, async base => {
    const redirected = await fetch(`${base}/api/check`, { redirect: 'manual' })
    assert.equal(redirected.status, 308)
    assert.match(redirected.headers.get('location'), /^https:/)
    const proxied = await fetch(`${base}/api/check`, { headers: { 'X-Forwarded-Proto': 'https' } })
    assert.equal(proxied.status, 200)
    assert.match(proxied.headers.get('strict-transport-security'), /max-age=/)
  })
})

test('login and OTP responses are never cached', async () => {
  await withServer('development', {}, async base => {
    for (const path of ['/api/auth/login', '/api/parental/auth/request-otp']) {
      const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      assert.equal(response.headers.get('cache-control'), 'no-store')
    }
  })
})
