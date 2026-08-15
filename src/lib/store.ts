import { Agent, Manager, WeeklyPerformance, MonthlyResult, RCA, ActionItem, Notification, CoachingRecord } from '../types';
import {
  INITIAL_AGENTS,
  INITIAL_MANAGERS,
  INITIAL_WEEKLY_PERFORMANCES,
  INITIAL_MONTHLY_RESULTS,
  INITIAL_RCAS,
  INITIAL_ACTION_ITEMS,
  INITIAL_NOTIFICATIONS,
} from './initial-data';
import { isDummyOrSupportAgent } from './perimeter';
import { getAuthToken } from './auth-helpers';

const STORAGE_KEYS = {
  AGENTS: 'perf_agents',
  MANAGERS: 'perf_managers',
  WEEKLY_PERFS: 'perf_weekly_perfs',
  MONTHLY_RESULTS: 'perf_monthly_results',
  RCAS: 'perf_rcas',
  ACTION_ITEMS: 'perf_action_items',
  NOTIFICATIONS: 'perf_notifications',
  SAVED_SIMULATIONS: 'perf_saved_simulations',
  COACHING_RECORDS: 'perf_coaching_records',
};

function loadItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function saveItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

class PerformanceStore {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.syncWithServer();
  }

  public async syncWithServer(): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.agents) && data.agents.length > 0) {
          const current = this.getAgents();
          const map = new Map<string, Agent>();
          for (const c of current) {
            map.set(c.id, c);
          }
          for (const sa of data.agents) {
            if (!isDummyOrSupportAgent(sa.nom_complet, sa.matricule_rh, sa.log_activite)) {
              map.set(sa.id, { ...map.get(sa.id), ...sa });
            }
          }
          saveItem(STORAGE_KEYS.AGENTS, Array.from(map.values()));
          this.notify();
        }
      }
    } catch {
      // Offline or server unavailable
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // AGENTS
  public getAgents(): Agent[] {
    const loaded = loadItem<Agent[]>(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
    const agentMap = new Map<string, Agent>();
    for (const a of INITIAL_AGENTS) {
      if (!isDummyOrSupportAgent(a.nom_complet, a.matricule_rh, a.log_activite)) {
        agentMap.set(a.id, { ...a });
      }
    }
    for (const a of loaded) {
      if (!isDummyOrSupportAgent(a.nom_complet, a.matricule_rh, a.log_activite)) {
        if (agentMap.has(a.id)) {
          const canonical = agentMap.get(a.id)!;
          const isStoredPlaceholder = /^AGENT\s+\d+$/i.test((a.nom_complet || '').trim());
          agentMap.set(a.id, {
            ...canonical,
            ...a,
            nom_complet: isStoredPlaceholder ? canonical.nom_complet : (a.nom_complet || canonical.nom_complet),
            nom: isStoredPlaceholder ? canonical.nom : (a.nom || canonical.nom),
            prenom: isStoredPlaceholder ? canonical.prenom : (a.prenom || canonical.prenom),
            manager_name: a.manager_name || canonical.manager_name,
            log_activite: a.log_activite || canonical.log_activite,
          });
        } else {
          agentMap.set(a.id, a);
        }
      }
    }
    return Array.from(agentMap.values());
  }

  public getAgentByMatricule(matricule?: string | null): Agent | undefined {
    if (!matricule) return undefined;
    const cleanMat = String(matricule).trim().toLowerCase();
    return this.getAgents().find(
      (a) =>
        String(a.matricule_rh).trim().toLowerCase() === cleanMat ||
        a.id.toLowerCase() === `agent-${cleanMat}` ||
        (a.log_activite && a.log_activite.toLowerCase() === cleanMat)
    );
  }

  public getAgentById(id?: string | null): Agent | undefined {
    if (!id) return undefined;
    const cleanId = String(id).trim().toLowerCase();
    return this.getAgents().find((a) => a.id.toLowerCase() === cleanId || a.matricule_rh.toLowerCase() === cleanId);
  }

  public async saveAgent(agent: Agent): Promise<boolean> {
    if (isDummyOrSupportAgent(agent.nom_complet, agent.matricule_rh, agent.log_activite)) return false;

    // Server-first update: verify with server before updating local cache
    const token = getAuthToken();
    if (token) {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(agent),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Erreur serveur lors de la sauvegarde de l\'agent.');
      }
    }

    const agents = this.getAgents();
    const idx = agents.findIndex((a) => a.id === agent.id || a.matricule_rh === agent.matricule_rh);
    if (idx >= 0) {
      agents[idx] = agent;
    } else {
      agents.push(agent);
    }
    saveItem(STORAGE_KEYS.AGENTS, agents);
    this.notify();
    return true;
  }

  public async deleteAgent(agentId: string): Promise<boolean> {
    const token = getAuthToken();
    if (token) {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Erreur serveur lors de la suppression de l\'agent.');
      }
    }

    const agents = this.getAgents().filter((a) => a.id !== agentId);
    saveItem(STORAGE_KEYS.AGENTS, agents);
    this.notify();
    return true;
  }

  // MANAGERS
  public getManagers(): Manager[] {
    const loaded = loadItem<Manager[]>(STORAGE_KEYS.MANAGERS, INITIAL_MANAGERS);
    const resultMap = new Map<string, Manager>();
    for (const m of INITIAL_MANAGERS) {
      resultMap.set(m.matricule || m.id, { ...m });
    }
    for (const m of loaded) {
      const key = m.matricule || m.id;
      if (resultMap.has(key)) {
        resultMap.set(key, { ...resultMap.get(key)!, ...m });
      } else {
        resultMap.set(key, m);
      }
    }
    return Array.from(resultMap.values());
  }

  public saveManager(manager: Manager): void {
    const managers = this.getManagers();
    const idx = managers.findIndex(
      (m) => (m.matricule && m.matricule === manager.matricule) || m.id === manager.id
    );
    if (idx >= 0) {
      managers[idx] = manager;
    } else {
      managers.push(manager);
    }
    saveItem(STORAGE_KEYS.MANAGERS, managers);
    this.notify();
  }

  // WEEKLY PERFORMANCES
  public getWeeklyPerformances(): WeeklyPerformance[] {
    const raw = loadItem<WeeklyPerformance[]>(STORAGE_KEYS.WEEKLY_PERFS, INITIAL_WEEKLY_PERFORMANCES);
    const dedupMap = new Map<string, WeeklyPerformance>();

    for (const p of raw) {
      if (isDummyOrSupportAgent(p.agent_name, null, p.log_activite)) continue;
      const key = `${(p.agent_id || p.log_activite || '').toLowerCase()}_${p.canal}_S${p.semaine}_${p.annee}`;
      dedupMap.set(key, p);
    }

    return Array.from(dedupMap.values());
  }

  public saveWeeklyPerformance(perf: WeeklyPerformance): void {
    if (isDummyOrSupportAgent(perf.agent_name, null, perf.log_activite)) return;
    const perfs = this.getWeeklyPerformances();
    const key = `${(perf.agent_id || perf.log_activite || '').toLowerCase()}_${perf.canal}_S${perf.semaine}_${perf.annee}`;
    const idx = perfs.findIndex(
      (p) =>
        p.id === perf.id ||
        `${(p.agent_id || p.log_activite || '').toLowerCase()}_${p.canal}_S${p.semaine}_${p.annee}` === key
    );
    if (idx >= 0) {
      perfs[idx] = perf;
    } else {
      perfs.push(perf);
    }
    saveItem(STORAGE_KEYS.WEEKLY_PERFS, perfs);
    this.notify();
  }

  public deleteWeeklyPerformance(perfId: string): void {
    const perfs = this.getWeeklyPerformances().filter((p) => p.id !== perfId);
    saveItem(STORAGE_KEYS.WEEKLY_PERFS, perfs);
    this.notify();
  }

  public saveWeeklyPerformanceBatch(batch: WeeklyPerformance[]): void {
    const perfs = this.getWeeklyPerformances();
    batch.forEach((perf) => {
      if (isDummyOrSupportAgent(perf.agent_name, null, perf.log_activite)) return;
      const key = `${(perf.agent_id || perf.log_activite || '').toLowerCase()}_${perf.canal}_S${perf.semaine}_${perf.annee}`;
      const idx = perfs.findIndex(
        (p) =>
          p.id === perf.id ||
          `${(p.agent_id || p.log_activite || '').toLowerCase()}_${p.canal}_S${p.semaine}_${p.annee}` === key
      );
      if (idx >= 0) perfs[idx] = perf;
      else perfs.push(perf);
    });
    saveItem(STORAGE_KEYS.WEEKLY_PERFS, perfs);
    this.notify();
  }

  // MONTHLY RESULTS
  public getMonthlyResults(): MonthlyResult[] {
    const raw = loadItem<MonthlyResult[]>(STORAGE_KEYS.MONTHLY_RESULTS, INITIAL_MONTHLY_RESULTS);
    const dedupMap = new Map<string, MonthlyResult>();

    for (const m of raw) {
      if (isDummyOrSupportAgent(m.agent_name, m.matricule_rh, null)) continue;
      const key = `${(m.agent_id || m.matricule_rh || m.agent_name || '').toLowerCase()}_${m.mois_key || m.mois_label}`;
      dedupMap.set(key, m);
    }

    return Array.from(dedupMap.values());
  }

  public saveMonthlyResultsBatch(batch: MonthlyResult[]): void {
    const results = this.getMonthlyResults();
    batch.forEach((res) => {
      if (isDummyOrSupportAgent(res.agent_name, res.matricule_rh, null)) return;
      const key = `${(res.agent_id || res.matricule_rh || res.agent_name || '').toLowerCase()}_${res.mois_key || res.mois_label}`;
      const idx = results.findIndex(
        (r) =>
          r.id === res.id ||
          `${(r.agent_id || r.matricule_rh || r.agent_name || '').toLowerCase()}_${r.mois_key || r.mois_label}` === key
      );
      if (idx >= 0) results[idx] = res;
      else results.push(res);
    });
    saveItem(STORAGE_KEYS.MONTHLY_RESULTS, results);
    this.notify();
  }

  public deleteMonthlyResult(id: string): void {
    const results = this.getMonthlyResults().filter((r) => r.id !== id);
    saveItem(STORAGE_KEYS.MONTHLY_RESULTS, results);
    this.notify();
  }

  public deleteMonthlyBatch(moisKey: string): void {
    const results = this.getMonthlyResults().filter((r) => r.mois_key !== moisKey);
    saveItem(STORAGE_KEYS.MONTHLY_RESULTS, results);
    this.notify();
  }

  // RCAS
  public getRcas(): RCA[] {
    return loadItem<RCA[]>(STORAGE_KEYS.RCAS, INITIAL_RCAS);
  }

  public saveRca(rca: RCA): void {
    const rcas = this.getRcas();
    const idx = rcas.findIndex((r) => r.id === rca.id);
    if (idx >= 0) rcas[idx] = rca;
    else rcas.push(rca);
    saveItem(STORAGE_KEYS.RCAS, rcas);
    this.notify();
  }

  public deleteRca(rcaId: string): void {
    const rcas = this.getRcas().filter((r) => r.id !== rcaId);
    saveItem(STORAGE_KEYS.RCAS, rcas);
    // Also delete associated action items
    const actions = this.getActionItems().filter((a) => a.rca_id !== rcaId);
    saveItem(STORAGE_KEYS.ACTION_ITEMS, actions);
    this.notify();
  }

  // ACTION ITEMS
  public getActionItems(): ActionItem[] {
    return loadItem<ActionItem[]>(STORAGE_KEYS.ACTION_ITEMS, INITIAL_ACTION_ITEMS);
  }

  public saveActionItem(action: ActionItem): void {
    const actions = this.getActionItems();
    const idx = actions.findIndex((a) => a.id === action.id);
    if (idx >= 0) actions[idx] = action;
    else actions.push(action);
    saveItem(STORAGE_KEYS.ACTION_ITEMS, actions);
    this.notify();
  }

  public deleteActionItem(actionId: string): void {
    const actions = this.getActionItems().filter((a) => a.id !== actionId);
    saveItem(STORAGE_KEYS.ACTION_ITEMS, actions);
    this.notify();
  }

  // NOTIFICATIONS
  public getNotifications(): Notification[] {
    return loadItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public markNotificationAsRead(notifId: string): void {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === notifId);
    if (target) {
      target.lu = true;
      saveItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notify();
    }
  }

  public addNotification(notif: Notification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    saveItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.notify();
  }

  // SAVED SIMULATIONS
  public getSavedSimulations(): any[] {
    return loadItem<any[]>(STORAGE_KEYS.SAVED_SIMULATIONS, []);
  }

  public saveSimulation(sim: any): void {
    const list = this.getSavedSimulations();
    list.unshift(sim);
    saveItem(STORAGE_KEYS.SAVED_SIMULATIONS, list);
    this.notify();
  }

  public deleteSimulation(id: string): void {
    const list = this.getSavedSimulations().filter((s) => s.id !== id);
    saveItem(STORAGE_KEYS.SAVED_SIMULATIONS, list);
    this.notify();
  }

  // COACHING RECORDS
  public getCoachingRecords(): CoachingRecord[] {
    return loadItem<CoachingRecord[]>(STORAGE_KEYS.COACHING_RECORDS, []);
  }

  public getCoachingRecord(agentId: string, periodType: 'week' | 'month', periodVal: string): CoachingRecord | undefined {
    const records = this.getCoachingRecords();
    return records.find(
      (r) => r.agent_id === agentId && r.period_type === periodType && String(r.period_value) === String(periodVal)
    );
  }

  public saveCoachingRecord(record: CoachingRecord): void {
    const records = this.getCoachingRecords();
    const idx = records.findIndex((r) => r.id === record.id);
    if (idx >= 0) records[idx] = record;
    else records.push(record);
    saveItem(STORAGE_KEYS.COACHING_RECORDS, records);
    this.notify();
  }

  public saveCoachingBatch(batch: CoachingRecord[]): void {
    const records = this.getCoachingRecords();
    batch.forEach((rec) => {
      const idx = records.findIndex((r) => r.id === rec.id);
      if (idx >= 0) records[idx] = rec;
      else records.push(rec);
    });
    saveItem(STORAGE_KEYS.COACHING_RECORDS, records);
    this.notify();
  }

  // RESET
  public resetData(): void {
    localStorage.removeItem(STORAGE_KEYS.AGENTS);
    localStorage.removeItem(STORAGE_KEYS.MANAGERS);
    localStorage.removeItem(STORAGE_KEYS.WEEKLY_PERFS);
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_RESULTS);
    localStorage.removeItem(STORAGE_KEYS.RCAS);
    localStorage.removeItem(STORAGE_KEYS.ACTION_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.notify();
  }
}

export const store = new PerformanceStore();
