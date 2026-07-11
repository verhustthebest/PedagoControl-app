const API_URL = import.meta.env.VITE_API_URL || '/api'
const AUTH_TOKEN_KEY = 'controle_pedagogique_token'

type ApiRequestOptions = RequestInit & {
  auth?: boolean
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
  token: string
  user: AuthUser
  roles: string[]
  school_id: string | null
}

export function getToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}, baseUrl = API_URL): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || 'Erreur API')
  }

  return data as T
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    }),
}
