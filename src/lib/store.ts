import { Agent, Manager, WeeklyPerformance, MonthlyResult, RCA, ActionItem, Notification } from '../types';
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
    return loadItem<Agent[]>(STORAGE_KEYS.AGENTS, INITIAL_AGENTS);
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
    return loadItem<Manager[]>(STORAGE_KEYS.MANAGERS, INITIAL_MANAGERS);
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
