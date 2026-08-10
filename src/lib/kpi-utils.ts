import { CanalType, AncienneteType, WeeklyPerformance } from '../types';

export const CANALS: CanalType[] = ['Phone', 'Email', 'MU'];
export const KPI_KEYS = ['rap', 'tr', 'ccx', 'dmt'] as const;

export const LOWER_IS_BETTER = ['tr', 'dmt'];

export const KPI_LABELS: Record<string, string> = {
  rap: 'RAP',
  tr: 'TR',
  ccx: 'CCX',
  dmt: 'DMT',
  vol: 'Volume',
  presence: 'Présence',
  assiduite: 'Assiduité',
  tickets: 'Tickets',
};

export const KPI_DESCRIPTIONS: Record<string, string> = {
  rap: 'Resolution at Point (résolution au premier contact)',
  tr: 'Transfert (taux de transfert)',
  ccx: 'Customer Contact Experience',
  dmt: 'Durée Moyenne de Traitement (en secondes)',
};

export interface KpiTargetDetail {
  s90: number;
  s100: number;
  s110: number;
  p90: number;
  p100: number;
  p110: number;
  sens: 'Haut' | 'Bas';
}

export type TargetsByKpi = Record<string, KpiTargetDetail>;

export const KPI_TARGETS: Record<CanalType, Record<AncienneteType, Record<string, KpiTargetDetail>>> = {
  Phone: {
    '+ 3 mois': {
      rap: { s90: 0.838, s100: 0.848, s110: 0.858, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.155, s100: 0.145, s110: 0.135, p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.92,  s100: 0.93,  s110: 0.94,  p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 650,   s100: 590,   s110: 530,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
    '- 3 mois': {
      rap: { s90: 0.818, s100: 0.828, s110: 0.838, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.165, s100: 0.155, s110: 0.145, p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.9,   s100: 0.91,  s110: 0.92,  p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 770,   s100: 710,   s110: 650,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
  },
  Email: {
    '+ 3 mois': {
      rap: { s90: 0.845, s100: 0.855, s110: 0.865, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.22,  s100: 0.2,   s110: 0.18,  p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.9389,s100: 0.9489,s110: 0.9589,p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 562,   s100: 542,   s110: 522,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
    '- 3 mois': {
      rap: { s90: 0.825, s100: 0.835, s110: 0.845, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.24,  s100: 0.22,  s110: 0.2,   p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.9189,s100: 0.9289,s110: 0.9389,p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 602,   s100: 582,   s110: 562,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
  },
  MU: {
    '+ 3 mois': {
      rap: { s90: 0.852, s100: 0.862, s110: 0.882, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.155, s100: 0.145, s110: 0.135, p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.94,  s100: 0.95,  s110: 0.96,  p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 690,   s100: 660,   s110: 630,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
    '- 3 mois': {
      rap: { s90: 0.827, s100: 0.837, s110: 0.852, p90: 7000, p100: 14000, p110: 17500, sens: 'Haut' },
      tr:  { s90: 0.165, s100: 0.155, s110: 0.145, p90: 4000, p100: 8000,  p110: 10000, sens: 'Bas' },
      ccx: { s90: 0.92,  s100: 0.93,  s110: 0.94,  p90: 3000, p100: 6000,  p110: 7500,  sens: 'Haut' },
      dmt: { s90: 750,   s100: 720,   s110: 690,   p90: 6000, p100: 12000, p110: 15000, sens: 'Bas' },
    },
  },
};

export const MAX_PRIME = 50000;

export const RAP_WEIGHT = 0.30;
export const CCX_WEIGHT = 0.30;
export const TR_WEIGHT  = 0.20;
export const DMT_WEIGHT = 0.20;

export const KPI_WEIGHTS: Record<string, number> = {
  rap: RAP_WEIGHT,
  ccx: CCX_WEIGHT,
  tr:  TR_WEIGHT,
  dmt: DMT_WEIGHT,
};

export interface KpiContributionDetail {
  kpiKey: string;
  label: string;
  value: number | null | undefined;
  formattedValue: string;
  target: number | null | undefined;
  formattedTarget: string;
  weightPct: number; // e.g. 30 for 30%
  weightDecimal: number; // e.g. 0.30
  conformityPct: number; // e.g. 98.9
  contributionIndexPct: number; // e.g. 29.68 (conformity * weightDecimal)
  primeAvantPoids: number; // e.g. 14000
  primePonderee: number; // e.g. 4200
}

export interface KpiContributionsResult {
  contributions: Record<string, KpiContributionDetail>;
  totalIndexScore: number;
  totalPrimeAvantPoids: number;
  totalPrimePonderee: number;
}

export function getKpiContributions(
  perf: Partial<WeeklyPerformance> | undefined | null,
  targets: Record<string, number>,
  canal: CanalType = 'Phone',
  anciennete: AncienneteType = '+ 3 mois'
): KpiContributionsResult {
  const contributions: Record<string, KpiContributionDetail> = {};
  let totalIndexScore = 0;
  let totalPrimeAvantPoids = 0;
  let totalPrimePonderee = 0;

  KPI_KEYS.forEach((k) => {
    const rawVal = perf ? (perf as any)[k] : null;
    const targetVal = targets?.[k];
    const weightDecimal = KPI_WEIGHTS[k] || 0.25;
    const weightPct = Math.round(weightDecimal * 100);

    let conformityPct = 0;
    if (rawVal != null && targetVal != null && !isNaN(rawVal) && !isNaN(targetVal) && targetVal !== 0) {
      const lower = LOWER_IS_BETTER.includes(k);
      const ratio = lower ? targetVal / rawVal : rawVal / targetVal;
      conformityPct = Math.min(Math.max(ratio, 0), 1.25) * 100;
    }

    const contributionIndexPct = Math.round(conformityPct * weightDecimal * 100) / 100;
    totalIndexScore += contributionIndexPct;

    const primeAvant = primeForKpi(rawVal, canal, anciennete, k);
    totalPrimeAvantPoids += primeAvant;

    const primePond = Math.round(primeAvant * weightDecimal);
    totalPrimePonderee += primePond;

    contributions[k] = {
      kpiKey: k,
      label: KPI_LABELS[k] || k.toUpperCase(),
      value: rawVal,
      formattedValue: formatKpiValue(k, rawVal),
      target: targetVal,
      formattedTarget: formatKpiValue(k, targetVal),
      weightPct,
      weightDecimal,
      conformityPct: Math.round(conformityPct * 10) / 10,
      contributionIndexPct,
      primeAvantPoids: primeAvant,
      primePonderee: primePond,
    };
  });

  return {
    contributions,
    totalIndexScore: Math.round(totalIndexScore * 100) / 100,
    totalPrimeAvantPoids,
    totalPrimePonderee,
  };
}

export function getKpiTarget(canal: CanalType, anciennete: AncienneteType, kpi: string): KpiTargetDetail | null {
  return KPI_TARGETS[canal]?.[anciennete]?.[kpi] || null;
}

export function getTarget100(canal: CanalType, anciennete: AncienneteType, kpi: string): number | null {
  const t = getKpiTarget(canal, anciennete, kpi);
  return t ? t.s100 : null;
}

export function primeForKpi(value: number | null | undefined, canal: CanalType, anciennete: AncienneteType, kpi: string): number {
  const t = getKpiTarget(canal, anciennete, kpi);
  if (!t || value == null || isNaN(value)) return 0;
  const haut = t.sens === 'Haut';
  if (haut) {
    if (value < t.s90) return 0;
    if (value < t.s100) return t.p90;
    if (value < t.s110) {
      const frac = (value - t.s100) / (t.s110 - t.s100);
      return Math.round(t.p100 + (t.p110 - t.p100) * frac);
    }
    return t.p110;
  } else {
    // sens Bas : lower is better. s90 > s100 > s110
    if (value > t.s90) return 0;
    if (value > t.s100) return t.p90;
    if (value > t.s110) {
      const frac = (t.s100 - value) / (t.s100 - t.s110);
      return Math.round(t.p100 + (t.p110 - t.p100) * frac);
    }
    return t.p110;
  }
}

export function primeForCanal(results: Record<string, any> | undefined | null, canal: CanalType, anciennete: AncienneteType): number {
  if (!results) return 0;
  return KPI_KEYS.reduce((sum, k) => sum + primeForKpi(results[k], canal, anciennete, k), 0);
}

export interface MulticanalResult {
  volTotal: number;
  pvSansPresence: number;
  pvFinale: number;
  contributions: Record<string, number>;
  canalPrimes: Record<string, number>;
  poids: Record<string, number>;
  statut: string;
}

export function calculateMulticanalPrime(
  perCanalResults: Record<string, { vol?: number; rap?: number | null; tr?: number | null; ccx?: number | null; dmt?: number | null }>,
  anciennete: AncienneteType,
  presence: number
): MulticanalResult {
  const volTotal = CANALS.reduce((s, c) => s + (perCanalResults[c]?.vol || 0), 0);
  let pvSansPresence = 0;
  const contributions: Record<string, number> = {};
  const canalPrimes: Record<string, number> = {};
  const poids: Record<string, number> = {};

  CANALS.forEach((c) => {
    const r = perCanalResults[c];
    if (!r || !r.vol) {
      contributions[c] = 0;
      canalPrimes[c] = 0;
      poids[c] = 0;
      return;
    }
    canalPrimes[c] = primeForCanal(r, c, anciennete);
    poids[c] = volTotal > 0 ? r.vol / volTotal : 0;
    contributions[c] = Math.round(canalPrimes[c] * poids[c]);
    pvSansPresence += contributions[c];
  });

  const pres = Math.min(presence == null ? 100 : presence, 100) / 100;
  const pvFinale = Math.round(pvSansPresence * pres);
  return {
    volTotal,
    pvSansPresence,
    pvFinale,
    contributions,
    canalPrimes,
    poids,
    statut: getStatutLabel(pvFinale),
  };
}

export function getStatutLabel(pvFinale: number): string {
  if (pvFinale >= 45000) return 'Objectif atteint';
  if (pvFinale >= 20000) return 'En progression';
  return 'À renforcer';
}

export function getStatutStyle(statut: string | undefined) {
  switch (statut) {
    case 'Objectif atteint': return { color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    case 'En progression': return { color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' };
    case 'À renforcer': return { color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' };
    default: return { color: 'text-muted-foreground', bg: 'bg-muted border-border' };
  }
}

export function getTargets(agentOrAnciennete?: any): Record<string, number> {
  const anciennete: AncienneteType = typeof agentOrAnciennete === 'string' 
    ? (agentOrAnciennete as AncienneteType) 
    : (agentOrAnciennete?.anciennete || '+ 3 mois');
  const t = KPI_TARGETS.Phone[anciennete] || KPI_TARGETS.Phone['+ 3 mois'];
  return { rap: t.rap.s100, tr: t.tr.s100, ccx: t.ccx.s100, dmt: t.dmt.s100 };
}

export function getKpiKeysForAgent(): readonly string[] {
  return KPI_KEYS;
}

export function getKpiStatus(value: number | null | undefined, target: number | null | undefined, kpiKey: string): 'success' | 'warning' | 'danger' | 'na' {
  if (value == null || target == null || isNaN(value) || isNaN(target)) return 'na';
  const lower = LOWER_IS_BETTER.includes(kpiKey);
  if (lower) {
    if (value <= target) return 'success';
    if (value <= target * 1.1) return 'warning';
    return 'danger';
  }
  const ratio = value / target;
  if (ratio >= 1) return 'success';
  if (ratio >= 0.9) return 'warning';
  return 'danger';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    case 'danger': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'warning': return 'bg-amber-500/10 border-amber-500/20';
    case 'danger': return 'bg-red-500/10 border-red-500/20';
    default: return 'bg-muted border-border';
  }
}

export function calculatePerformanceScore(perf: Partial<WeeklyPerformance> | undefined | null, targets: Record<string, number>, _agent?: any): number {
  if (!perf) return 0;
  const res = getKpiContributions(perf, targets);
  return res.totalIndexScore;
}

export function getScoreLevel(score: number) {
  if (score >= 95) return { label: 'Exceptionnel', color: 'text-emerald-500', emoji: '🏆' };
  if (score >= 85) return { label: 'Excellent', color: 'text-emerald-400', emoji: '⭐' };
  if (score >= 75) return { label: 'Bon', color: 'text-blue-500', emoji: '👍' };
  if (score >= 60) return { label: 'Acceptable', color: 'text-amber-500', emoji: '📊' };
  if (score >= 45) return { label: 'À améliorer', color: 'text-orange-500', emoji: '⚠️' };
  return { label: 'Critique', color: 'text-red-500', emoji: '🚨' };
}

export interface AssiduiteDetails {
  hPlanifiees: number;
  hAbsence: number;
  hEffectuees: number;
  assiduitePct: number;
  tauxAbsencePct: number;
  formattedAssiduite: string;
  formattedAbsence: string;
}

export function getAssiduiteDetails(perf: { h_planifiees?: number | null; h_absence?: number | null; presence?: number | null; assiduite?: number | null } | undefined | null): AssiduiteDetails {
  let hPlan = 160;
  let hAbs = 0;

  if (perf) {
    if (perf.h_planifiees != null && !isNaN(perf.h_planifiees) && perf.h_planifiees > 0) {
      hPlan = perf.h_planifiees;
    }
    if (perf.h_absence != null && !isNaN(perf.h_absence)) {
      hAbs = perf.h_absence;
    } else if (perf.presence != null && !isNaN(perf.presence)) {
      const pres = perf.presence <= 1 ? perf.presence * 100 : perf.presence;
      hAbs = Math.round((hPlan * (100 - pres)) / 100);
    }
  }

  if (hPlan <= 0) {
    return {
      hPlanifiees: 0,
      hAbsence: 0,
      hEffectuees: 0,
      assiduitePct: 100,
      tauxAbsencePct: 0,
      formattedAssiduite: '100.0%',
      formattedAbsence: '0.0%',
    };
  }

  const hEff = Math.max(0, hPlan - hAbs);
  const assid = Math.max(0, Math.min(100, (hEff / hPlan) * 100));
  const absPct = Math.max(0, Math.min(100, (hAbs / hPlan) * 100));

  return {
    hPlanifiees: hPlan,
    hAbsence: hAbs,
    hEffectuees: hEff,
    assiduitePct: Math.round(assid * 10) / 10,
    tauxAbsencePct: Math.round(absPct * 10) / 10,
    formattedAssiduite: `${(Math.round(assid * 10) / 10).toFixed(1)}%`,
    formattedAbsence: `${(Math.round(absPct * 10) / 10).toFixed(1)}%`,
  };
}

export function calculateAssiduiteFromPerf(perf: { h_planifiees?: number | null; h_absence?: number | null; presence?: number | null; assiduite?: number | null }): number | null {
  if (!perf) return null;
  const details = getAssiduiteDetails(perf);
  return details.assiduitePct;
}

export function formatKpiValue(key: string, value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'N/A';
  switch (key) {
    case 'rap':
    case 'tr':
    case 'ccx':
      return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
    case 'assiduite':
    case 'presence':
      return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
    case 'dmt':
      return `${Math.round(value)} s`;
    case 'vol':
    case 'tickets':
      return Number.isFinite(value) ? value.toString() : 'N/A';
    default:
      return value.toString();
  }
}

export function formatFCFA(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}
