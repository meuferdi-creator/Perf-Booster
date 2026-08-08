import { getStoredAuth, getManagerName } from './auth-helpers';

export function getManagerNameScope(): string | null {
  const auth = getStoredAuth();
  return getManagerName(auth);
}

export function filterByManager<T extends { manager_name?: string }>(items: T[], managerName: string | null): T[] {
  if (!managerName) return items || [];
  return (items || []).filter((i) => i?.manager_name === managerName);
}

export function filterAgentsByManager<T extends { manager_name?: string }>(agents: T[], managerName: string | null): T[] {
  if (!managerName) return agents || [];
  return (agents || []).filter((a) => a?.manager_name === managerName);
}

export function assertInScope<T extends { manager_name?: string }>(record: T | null | undefined, managerName: string | null): boolean {
  if (!managerName) return true;
  return record?.manager_name === managerName;
}
