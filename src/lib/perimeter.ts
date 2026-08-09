import { getStoredAuth } from './auth-helpers';
import { StoredAuth } from '../types';

export function getManagerNameScope(): string | null {
  const auth = getStoredAuth();
  return auth?.name || auth?.manager_name || null;
}

export function matchesManagerScope(
  itemManagerName: string | undefined | null,
  auth: StoredAuth | null = getStoredAuth()
): boolean {
  if (!auth) return false;

  // Global Admin (SABI Prospere) sees everything
  if (auth.isGlobalAdmin || auth.matricule === '495' || (auth.name && auth.name.toLowerCase().includes('sabi'))) {
    return true;
  }

  if (!itemManagerName) return false;

  const itemMgr = itemManagerName.trim().toLowerCase();
  const authName = (auth.name || '').trim().toLowerCase();
  const authNom = (auth.nom || '').trim().toLowerCase();
  const authMatricule = (auth.matricule || '').trim().toLowerCase();

  if (!itemMgr) return false;

  // Exact matches
  if (
    itemMgr === authName ||
    (authNom && itemMgr === authNom) ||
    (authMatricule && itemMgr === authMatricule)
  ) {
    return true;
  }

  // Word boundary matches
  if (authNom && authNom.length >= 2 && (itemMgr === authNom || itemMgr.startsWith(authNom + ' ') || itemMgr.endsWith(' ' + authNom))) {
    return true;
  }

  if (authName && (itemMgr === authName || itemMgr.startsWith(authName + ' ') || itemMgr.endsWith(' ' + authName))) {
    return true;
  }

  return false;
}

export function filterByManager<T extends { manager_name?: string }>(
  items: T[],
  managerName: string | null = getManagerNameScope()
): T[] {
  const auth = getStoredAuth();
  if (!auth) return [];
  if (auth.isGlobalAdmin || auth.matricule === '495' || (auth.name && auth.name.includes('SABI'))) {
    return items || [];
  }
  return (items || []).filter((i) => matchesManagerScope(i?.manager_name, auth));
}

export function filterAgentsByManager<T extends { manager_name?: string }>(
  agents: T[],
  managerName: string | null = getManagerNameScope()
): T[] {
  return filterByManager(agents, managerName);
}

export function assertInScope<T extends { manager_name?: string }>(
  record: T | null | undefined,
  managerName: string | null = getManagerNameScope()
): boolean {
  const auth = getStoredAuth();
  if (!auth) return false;
  if (auth.isGlobalAdmin || auth.matricule === '495' || (auth.name && auth.name.includes('SABI'))) {
    return true;
  }
  return matchesManagerScope(record?.manager_name, auth);
}
