import { StoredAuth } from '../types';

const AUTH_KEY = 'perf_auth';

export function getStoredAuth(): StoredAuth | null {
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const auth = getStoredAuth();
  return auth?.token || null;
}

export function setStoredAuth(data: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export async function clearAuth(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout, but always clear local auth
    }
  }
  localStorage.removeItem(AUTH_KEY);
}

export const clearStoredAuth = clearAuth;
export const logout = clearAuth;

export function isManager(auth: StoredAuth | null): boolean {
  return auth?.role === 'manager' || auth?.role === 'admin';
}

export function isAgent(auth: StoredAuth | null): boolean {
  return auth?.role === 'agent';
}

export function getManagerName(auth: StoredAuth | null): string | null {
  return auth?.manager_name || null;
}
