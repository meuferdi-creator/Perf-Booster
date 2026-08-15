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
  if (auth.isGlobalAdmin || auth.matricule === '495' || auth.matricule === '391') {
    return true;
  }

  if (!itemManagerName) return false;

  const itemMgr = itemManagerName.trim().toLowerCase();
  const authName = (auth.name || '').trim().toLowerCase();
  const authNom = (auth.nom || '').trim().toLowerCase();
  const authMatricule = (auth.matricule || '').trim().toLowerCase();

  if (!itemMgr) return false;

  // Exact comparison against manager full name, nom, or matricule
  return (
    itemMgr === authName ||
    (authNom !== '' && itemMgr === authNom) ||
    (authMatricule !== '' && itemMgr === authMatricule)
  );
}

export function isDummyOrSupportAgent(
  agentName?: string | null,
  matricule?: string | null,
  logActivite?: string | null
): boolean {
  const cleanName = (agentName || '').trim().toLowerCase();
  const cleanMat = (matricule || '').trim().toLowerCase();
  const cleanLog = (logActivite || '').trim().toLowerCase();

  if (!cleanName && !cleanMat && !cleanLog) return true;

  if (
    cleanName === '' ||
    cleanName === 'null' ||
    cleanName === 'undefined' ||
    cleanName === 'non assigné' ||
    cleanName === 'non assigne' ||
    cleanName === 'support agent' ||
    cleanName === 'agent support' ||
    cleanName.includes('placeholder') ||
    cleanName.includes('moi test') ||
    cleanName === 'test'
  ) {
    return true;
  }

  if (cleanMat === '1000' && (cleanName.includes('support') || cleanName === '')) return true;
  if (cleanLog === 'log' || cleanLog === 'agent' || cleanLog === 'support agent') return true;

  return false;
}

export function filterByManager<T extends { manager_name?: string; agent_name?: string; nom_complet?: string; matricule_rh?: string; log_activite?: string }>(
  items: T[],
  managerName: string | null = getManagerNameScope()
): T[] {
  const auth = getStoredAuth();
  if (!auth) return [];

  const cleanItems = (items || []).filter((item) => {
    const name = item.agent_name || item.nom_complet;
    return !isDummyOrSupportAgent(name, item.matricule_rh, item.log_activite);
  });

  if (auth.isGlobalAdmin || auth.matricule === '495' || auth.matricule === '391') {
    return cleanItems;
  }
  return cleanItems.filter((i) => matchesManagerScope(i?.manager_name, auth));
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
  if (auth.isGlobalAdmin || auth.matricule === '495' || auth.matricule === '391') {
    return true;
  }
  return matchesManagerScope(record?.manager_name, auth);
}
