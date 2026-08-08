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

export function setStoredAuth(data: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isManager(auth: StoredAuth | null): boolean {
  return auth?.role === 'manager' || auth?.role === 'admin';
}

export function isAgent(auth: StoredAuth | null): boolean {
  return auth?.role === 'agent';
}

export function getManagerName(auth: StoredAuth | null): string | null {
  return auth?.manager_name || null;
}
