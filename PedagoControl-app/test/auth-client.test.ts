import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  apiRequest, authApi, clearMemorySession, establishMemorySession, getMemorySession, restoreSession,
} from '../src/services/api.ts'

const user = { id: '1', first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', school_id: '1', roles: ['ENSEIGNANT'] }
const loginResponse = { accessToken: 'access-one', csrfToken: 'csrf-one', user, roles: user.roles, school_id: '1' }

function json(status: number, body: unknown) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function browser() {
  const redirects: string[] = []
  const events = new EventTarget()
  Object.assign(globalThis, {
    window: Object.assign(events, {
      location: { pathname: '/', replace(path: string) { redirects.push(path); this.pathname = path } },
      localStorage: { removeItem() {} }, sessionStorage: { removeItem() {} },
    }),
  })
  return redirects
}

test.beforeEach(() => { clearMemorySession(); browser() })

test('authentication tokens are never written to browser storage', () => {
  const source = readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8')
  assert.equal(source.includes('.setItem('), false)
  establishMemorySession(loginResponse)
  assert.equal(getMemorySession().accessToken, 'access-one')
  assert.equal(getMemorySession().csrfToken, 'csrf-one')
})

test('login uses credentials include and keeps tokens only in memory', async () => {
  let init: RequestInit | undefined
  globalThis.fetch = async (_url, options) => { init = options; return json(200, loginResponse) }
  await authApi.login('ada@example.com', 'password')
  assert.equal(init?.credentials, 'include')
  assert.equal(getMemorySession().accessToken, 'access-one')
  assert.equal(getMemorySession().user?.id, '1')
})

test('remember me is sent to the Backend without browser token storage', async () => {
  let body = ''
  globalThis.fetch = async (_url, options) => { body = String(options?.body); return json(200, loginResponse) }
  await authApi.login('ada@example.com', 'password', true)
  assert.equal(JSON.parse(body).remember_me, true)
  assert.equal(getMemorySession().accessToken, 'access-one')
})

test('session restoration performs csrf, refresh, then authenticated me', async () => {
  const calls: string[] = []
  globalThis.fetch = async (input, init) => {
    const url = String(input); calls.push(url)
    assert.equal(init?.credentials, 'include')
    if (url.endsWith('/auth/csrf')) return json(200, { csrfToken: 'csrf-restored' })
    if (url.endsWith('/auth/refresh')) {
      assert.equal(new Headers(init?.headers).get('X-CSRF-Token'), 'csrf-restored')
      return json(200, { accessToken: 'access-restored', csrfToken: 'csrf-rotated' })
    }
    return json(200, { user, roles: user.roles, school_id: '1' })
  }
  await restoreSession('https://api.example/api')
  assert.deepEqual(calls.map(url => new URL(url).pathname.replace('/api', '')), ['/auth/csrf', '/auth/refresh', '/auth/me'])
  assert.equal(getMemorySession().accessToken, 'access-restored')
  assert.equal(getMemorySession().user?.email, user.email)
})

test('startup refresh 401 is a silent disconnected state without redirect or event', async () => {
  const redirects = browser()
  let unauthenticatedEvents = 0
  window.addEventListener('pedago:unauthenticated', () => { unauthenticatedEvents += 1 })
  let refreshes = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/csrf')) return json(200, { csrfToken: 'csrf-startup' })
    refreshes += 1
    return json(401, { message: 'Authentication required' })
  }

  const session = await restoreSession('https://api.example/api')

  assert.equal(session, null)
  assert.equal(refreshes, 1)
  assert.equal(unauthenticatedEvents, 0)
  assert.deepEqual(redirects, [])
  assert.equal(getMemorySession().user, null)
})

test('concurrent 401 responses share exactly one refresh rotation and retry once', async () => {
  establishMemorySession(loginResponse)
  let refreshes = 0
  let privateCalls = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/refresh')) { refreshes += 1; return json(200, { accessToken: 'access-two', csrfToken: 'csrf-two' }) }
    if (url.endsWith('/auth/me')) return json(200, { user, roles: user.roles, school_id: '1' })
    privateCalls += 1
    return privateCalls <= 2 ? json(401, { message: 'expired' }) : json(200, { ok: true })
  }
  const results = await Promise.all([
    apiRequest<{ ok: boolean }>('/private/a', {}, 'https://api.example/api'),
    apiRequest<{ ok: boolean }>('/private/b', {}, 'https://api.example/api'),
  ])
  assert.equal(refreshes, 1)
  assert.equal(results.every(result => result.ok), true)
})

test('a repeated 401 does not create a refresh loop', async () => {
  const redirects = browser()
  establishMemorySession(loginResponse)
  let refreshes = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/refresh')) { refreshes += 1; return json(200, { accessToken: 'new', csrfToken: 'new-csrf' }) }
    if (url.endsWith('/auth/me')) return json(200, { user, roles: user.roles, school_id: '1' })
    return json(401, {})
  }
  await assert.rejects(() => apiRequest('/private', {}, 'https://api.example/api'))
  assert.equal(refreshes, 1)
  assert.deepEqual(redirects, ['/non-authentifie'])
})

test('refresh failure during use clears memory and redirects to session-expired page', async () => {
  const redirects = browser()
  establishMemorySession(loginResponse)
  globalThis.fetch = async () => json(401, {})
  await assert.rejects(() => apiRequest('/private', {}, 'https://api.example/api'))
  assert.equal(getMemorySession().user, null)
  assert.equal(redirects.at(-1), '/non-authentifie')
})

test('403 redirects to access denied without disconnecting', async () => {
  const redirects = browser()
  establishMemorySession(loginResponse)
  globalThis.fetch = async () => json(403, {})
  await assert.rejects(() => apiRequest('/private', {}, 'https://api.example/api'))
  assert.equal(getMemorySession().user?.id, '1')
  assert.equal(redirects.at(-1), '/acces-interdit')
})

test('logout sends credentials and CSRF then clears memory immediately', async () => {
  const redirects = browser()
  establishMemorySession(loginResponse)
  let init: RequestInit | undefined
  globalThis.fetch = async (_input, options) => { init = options; return json(204, null) }
  const pending = authApi.logout()
  assert.equal(getMemorySession().accessToken, null)
  await pending
  assert.equal(init?.credentials, 'include')
  assert.equal(new Headers(init?.headers).get('X-CSRF-Token'), 'csrf-one')
  assert.equal(redirects.at(-1), '/login')
})
