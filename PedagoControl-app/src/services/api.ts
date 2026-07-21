const API_URL = import.meta.env?.VITE_API_URL || '/api'
const LEGACY_AUTH_KEYS = ['controle_pedagogique_token', 'controle_pedagogique_user', 'pedagoMockSession']
export const AUTH_UNAUTHENTICATED_EVENT = 'pedago:unauthenticated'
export const AUTH_FORBIDDEN_EVENT = 'pedago:forbidden'

type ApiRequestOptions = RequestInit & { auth?: boolean; retryAuth?: boolean }

export class ApiError extends Error {
  readonly status: number
  readonly requestId?: string
  constructor(message: string, status: number, requestId?: string) { super(message); this.name = 'ApiError'; this.status = status; this.requestId = requestId }
}

export function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.requestId ? `${error.message} (référence : ${error.requestId})` : error.message
  return error instanceof Error ? error.message : 'Erreur API'
}

export type AuthUser = {
  id: string
  first_name: string
  last_name: string
  email: string
  school_id: string | null
  roles: string[]
}

export type LoginResponse = {
  token?: string
  accessToken: string
  csrfToken: string
  user: AuthUser
  roles: string[]
  school_id: string | null
}

type MemorySession = { accessToken: string | null; csrfToken: string | null; user: AuthUser | null }
const memory: MemorySession = { accessToken: null, csrfToken: null, user: null }
let refreshLock: Promise<MemorySession> | null = null
let restoreLock: Promise<MemorySession | null> | null = null

export function cleanupLegacyAuthStorage(storage: Pick<Storage, 'removeItem'> | null = typeof window === 'undefined' ? null : window.localStorage) {
  for (const key of LEGACY_AUTH_KEYS) storage?.removeItem(key)
  if (typeof window !== 'undefined') for (const key of LEGACY_AUTH_KEYS) window.sessionStorage.removeItem(key)
}

export function getMemorySession(): Readonly<MemorySession> { return memory }
export function clearMemorySession() { memory.accessToken = null; memory.csrfToken = null; memory.user = null }

export function establishMemorySession(session: LoginResponse) {
  memory.accessToken = session.accessToken || session.token || null
  memory.csrfToken = session.csrfToken
  memory.user = { ...session.user, roles: session.roles || session.user.roles || [] }
  return memory
}

function redirect(path: string) {
  if (typeof window !== 'undefined' && window.location.pathname !== path) window.location.replace(path)
}

async function readJson(response: Response) { return response.json().catch(() => null) }

async function raw(endpoint: string, options: RequestInit = {}, baseUrl = API_URL) {
  return fetch(`${baseUrl}${endpoint}`, { credentials: 'include', ...options })
}

/**
 * Restaure au plus une fois la session au démarrage. L'absence de cookie refresh
 * est un état anonyme normal : elle ne déclenche ni événement ni erreur publique.
 */
export function restoreSession(baseUrl = API_URL): Promise<MemorySession | null> {
  if (restoreLock) return restoreLock
  restoreLock = (async () => {
    try {
      const csrfResponse = await raw('/auth/csrf', { method: 'GET' }, baseUrl)
      const csrfData = await readJson(csrfResponse)
      if (!csrfResponse.ok || !csrfData?.csrfToken) return null
      memory.csrfToken = csrfData.csrfToken
      return await refreshSession(baseUrl, false)
    } catch {
      clearMemorySession()
      return null
    }
  })().finally(() => { restoreLock = null })
  return restoreLock
}

export function refreshSession(baseUrl = API_URL, notifyExpiration = true): Promise<MemorySession> {
  if (refreshLock) return refreshLock
  refreshLock = (async () => {
    if (!memory.csrfToken) throw new Error('Session unavailable')
    const response = await raw('/auth/refresh', {
      method: 'POST',
      headers: { 'X-CSRF-Token': memory.csrfToken },
    }, baseUrl)
    const data = await readJson(response)
    if (!response.ok || !data?.accessToken || !data?.csrfToken) throw new Error('Session unavailable')
    memory.accessToken = data.accessToken
    memory.csrfToken = data.csrfToken

    const meResponse = await raw('/auth/me', { headers: { Authorization: `Bearer ${memory.accessToken}` } }, baseUrl)
    const me = await readJson(meResponse)
    if (!meResponse.ok || !me?.user) throw new Error('Session unavailable')
    memory.user = { ...me.user, roles: me.roles || me.user.roles || [] }
    return memory
  })().catch((error) => {
    clearMemorySession()
    // Seule une expiration pendant l'utilisation doit afficher l'écran dédié.
    if (notifyExpiration && typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_UNAUTHENTICATED_EVENT))
    throw error
  }).finally(() => { refreshLock = null })
  return refreshLock
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}, baseUrl = API_URL): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (options.auth !== false && memory.accessToken) headers.set('Authorization', `Bearer ${memory.accessToken}`)

  const response = await raw(endpoint, { ...options, headers }, baseUrl)
  if (response.status === 401 && options.auth !== false && options.retryAuth !== false) {
    try {
      await refreshSession(baseUrl)
      return apiRequest<T>(endpoint, { ...options, retryAuth: false }, baseUrl)
    } catch {
      clearMemorySession()
      redirect('/non-authentifie')
      throw new Error('Authentication required')
    }
  }

  const data = await readJson(response)
  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      clearMemorySession()
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_UNAUTHENTICATED_EVENT))
      redirect('/non-authentifie')
    } else if (response.status === 403) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_FORBIDDEN_EVENT))
      redirect('/acces-interdit')
    }
    throw new ApiError(data?.message || 'Erreur API', response.status, data?.request_id)
  }
  return data as T
}

async function endSession(endpoint: '/auth/logout' | '/auth/logout-all') {
  const csrfToken = memory.csrfToken
  const accessToken = memory.accessToken
  const request = raw(endpoint, {
    method: 'POST',
    headers: {
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(endpoint === '/auth/logout-all' && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }).catch(() => undefined)
  clearMemorySession()
  cleanupLegacyAuthStorage()
  redirect('/login')
  await request
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST', auth: false, retryAuth: false, credentials: 'include', body: JSON.stringify({ email, password }),
    })
    establishMemorySession(response)
    return response
  },
  me: () => apiRequest<{ user: AuthUser; roles: string[]; school_id: string | null }>('/auth/me'),
  restore: restoreSession,
  logout: () => endSession('/auth/logout'),
  logoutAll: () => endSession('/auth/logout-all'),
}
