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
      agentMap.set(a.id, { ...a });
    }
    for (const a of loaded) {
      if (agentMap.has(a.id)) {
        agentMap.set(a.id, { ...agentMap.get(a.id)!, ...a });
      } else {
        agentMap.set(a.id, a);
      }
    }
    return Array.from(agentMap.values());
  }

  public saveAgent(agent: Agent): void {
    const agents = this.getAgents();
    const idx = agents.findIndex((a) => a.id === agent.id);
    if (idx >= 0) {
      agents[idx] = agent;
    } else {
      agents.push(agent);
    }
    saveItem(STORAGE_KEYS.AGENTS, agents);
    this.notify();
  }

  public deleteAgent(agentId: string): void {
    const agents = this.getAgents().filter((a) => a.id !== agentId);
    saveItem(STORAGE_KEYS.AGENTS, agents);
    this.notify();
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
    return loadItem<WeeklyPerformance[]>(STORAGE_KEYS.WEEKLY_PERFS, INITIAL_WEEKLY_PERFORMANCES);
  }

  public saveWeeklyPerformance(perf: WeeklyPerformance): void {
    const perfs = this.getWeeklyPerformances();
    const idx = perfs.findIndex((p) => p.id === perf.id);
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
      const idx = perfs.findIndex((p) => p.id === perf.id);
      if (idx >= 0) perfs[idx] = perf;
      else perfs.push(perf);
    });
    saveItem(STORAGE_KEYS.WEEKLY_PERFS, perfs);
    this.notify();
  }

  // MONTHLY RESULTS
  public getMonthlyResults(): MonthlyResult[] {
    return loadItem<MonthlyResult[]>(STORAGE_KEYS.MONTHLY_RESULTS, INITIAL_MONTHLY_RESULTS);
  }

  public saveMonthlyResultsBatch(batch: MonthlyResult[]): void {
    const results = this.getMonthlyResults();
    batch.forEach((res) => {
      const idx = results.findIndex((r) => r.id === res.id);
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
