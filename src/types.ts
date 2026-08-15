export type CanalType = 'Phone' | 'Email' | 'MU';
export type AncienneteType = '+ 3 mois' | '- 3 mois';
export type ContratType = 'CDI' | 'CDD' | 'STG';
export type AgentStatutType = 'actif' | 'inactif';
export type RoleType = 'agent' | 'manager' | 'admin';

export interface Agent {
  id: string;
  matricule_rh: string;
  nom_complet: string;
  nom: string;
  prenom: string;
  manager_name: string;
  date_mep?: string;
  contrat: ContratType;
  statut_contrat?: string;
  anciennete: AncienneteType;
  log_activite: string;
  premier_login?: boolean;
  statut: AgentStatutType;
  email?: string;
  photo_url?: string;
  role: RoleType;
  xp?: number;
  niveau?: number;
  badges?: string[];
}

export interface Manager {
  id: string;
  name: string;
  nom?: string;
  prenom?: string;
  matricule?: string;
  premier_login?: boolean;
  locked_password?: boolean;
  isGlobalAdmin?: boolean;
}

export interface WeeklyPerformance {
  id: string;
  agent_id: string;
  agent_name: string;
  log_activite: string;
  manager_name: string;
  canal: CanalType;
  semaine: number;
  annee: number;
  yes?: number | null;
  no?: number | null;
  rap: number | null; // 0-1
  yes_cumul_mois?: number | null;
  no_cumul_mois?: number | null;
  rap_mois?: number | null;
  besoin_oui?: number | null;
  ccx: number | null; // 0-1
  tr: number | null;  // 0-1
  dmt: number | null; // seconds
  vol: number | null;
  h_planifiees?: number | null;
  h_absence?: number | null;
  statut?: string;
  feedback?: string;
  axes_amelioration?: string;
  commentaires?: string;
  agent_comment?: string;
  comment_date?: string;
  coaching?: string;
  plan_action?: string;
  qa_notes?: string;
  customer_score?: number | null;
  business_score?: number | null;
  compliance_score?: number | null;
}

export interface MonthlyResult {
  id: string;
  agent_id: string;
  matricule_rh: string;
  agent_name: string;
  manager_name: string;
  anciennete: string;
  mois_label: string; // e.g. "Juillet 2026"
  mois_key: string;   // e.g. "2026-07"
  annee: number;
  numero_mois: number;
  vol_total: number;
  poids_phone?: number;
  poids_email?: number;
  poids_mu?: number;
  contrib_phone?: number;
  contrib_email?: number;
  contrib_mu?: number;
  pv_sans_presence: number;
  presence: number; // %
  pv_finale: number; // FCFA
  statut: 'Objectif atteint' | 'En progression' | 'À renforcer' | string;
  commentaire?: string;

  // Channel details
  vol_phone?: number;
  rap_phone?: number;
  tr_phone?: number;
  ccx_phone?: number;
  dmt_phone?: number;

  vol_email?: number;
  rap_email?: number;
  tr_email?: number;
  ccx_email?: number;
  dmt_email?: number;

  vol_mu?: number;
  rap_mu?: number;
  tr_mu?: number;
  ccx_mu?: number;
  dmt_mu?: number;

  h_planifiees?: number;
  h_absence?: number;
}

export interface SavedSimulation {
  id: string;
  date_saved: string;
  agent_id: string;
  agent_name: string;
  matricule_rh: string;
  mois_label: string;
  prime_reelle: number;
  prime_simulee: number;
  gain_potentiel: number;
  scenario_name: string;
  details?: any;
}

export type NotificationType = 'success' | 'warning' | 'info' | 'alert';

export interface Notification {
  id: string;
  agent_id: string;
  type: NotificationType;
  titre: string;
  message: string;
  lu: boolean;
  semaine?: number;
  kpi?: string;
  created_date?: string;
}

export type RcaStatut = 'ouvert' | 'en_cours' | 'resolu' | 'cloture';
export type RcaPriorite = 'haute' | 'moyenne' | 'basse';

export interface RCA {
  id: string;
  agent_id: string;
  agent_name: string;
  semaine: number;
  annee: number;
  kpi_concerne?: string;
  description: string;
  analyse_cause?: string;
  statut: RcaStatut;
  priorite: RcaPriorite;
  date_cloture?: string;
  created_by_name?: string;
}

export type ActionItemStatut = 'a_faire' | 'en_cours' | 'termine';

export interface ActionItem {
  id: string;
  rca_id: string;
  agent_id: string;
  agent_name?: string;
  action: string;
  responsable?: string;
  echeance?: string;
  statut: ActionItemStatut;
  progres: number; // 0-100
}

export interface CoachingRecord {
  id: string;
  agent_id: string;
  agent_name: string;
  period_type: 'week' | 'month';
  period_value: string; // e.g. "31" or "2026-07"
  content: string; // Markdown formatted coaching content
  updated_at: string;
  created_by?: string;
  status?: 'generated' | 'edited' | 'sent';
}

export interface StoredAuth {
  role: 'agent' | 'manager' | 'admin';
  id: string;
  token?: string;
  matricule?: string;
  name: string;
  nom?: string;
  prenom?: string;
  manager_name?: string;
  isGlobalAdmin?: boolean;
  premier_login?: boolean;
  anciennete?: AncienneteType;
  log_activite?: string;
  locked_password?: boolean;
}
