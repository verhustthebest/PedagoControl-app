const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export function getToken() {
  return localStorage.getItem("controle_pedagogique_token");
}

export function setToken(token: string) {
  localStorage.setItem("controle_pedagogique_token", token);
}

export function clearToken() {
  localStorage.removeItem("controle_pedagogique_token");
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Erreur API");
  }

  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{
      token: string;
      user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        school_id: number | null;
        roles: string[];
      };
    }>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    apiRequest<{
      user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        school_id: number | null;
        roles: string[];
      };
    }>("/auth/me"),
};
