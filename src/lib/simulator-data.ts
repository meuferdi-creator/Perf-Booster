import { store } from './store';
import { Agent, MonthlyResult, WeeklyPerformance, AncienneteType, CanalType } from '../types';
import { calculateMulticanalPrime, MulticanalResult } from './kpi-utils';

export interface ChannelMetrics {
  vol: number;
  rap: number; // 0-100 (percentage)
  tr: number;  // 0-100 (percentage)
  ccx: number; // 0-100 (percentage)
  dmt: number; // seconds
}

export interface AgentSimulationData {
  hasData: boolean;
  agentId: string;
  matricule: string;
  agentName: string;
  managerName: string;
  moisLabel: string;
  anciennete: AncienneteType;
  presence: number; // 0-100
  channels: Record<CanalType, ChannelMetrics>;
  realResult: MulticanalResult;
}

export function getAvailableMonths(): string[] {
  const defaultMonths = ['Juillet 2026', 'Juin 2026', 'Août 2026'];
  const monthlyRes = store.getMonthlyResults();
  const monthsSet = new Set<string>(defaultMonths);
  monthlyRes.forEach((m) => {
    if (m.mois_label) monthsSet.add(m.mois_label);
  });
  return Array.from(monthsSet);
}

export function getAgentImportedData(matriculeOrId: string, moisLabel: string): AgentSimulationData | null {
  const agents = store.getAgents();
  const agent = agents.find(
    (a) => a.id === matriculeOrId || a.matricule_rh === matriculeOrId || a.nom_complet === matriculeOrId
  );

  const matricule = agent ? agent.matricule_rh : matriculeOrId;
  const agentName = agent ? agent.nom_complet : matriculeOrId;
  const agentId = agent ? agent.id : matriculeOrId;

  // Find monthly result
  const monthlyResList = store.getMonthlyResults();
  const monthlyMatch = monthlyResList.find(
    (m) =>
      (m.agent_id === agentId || m.matricule_rh === matricule || m.agent_name.toLowerCase().includes(agentName.toLowerCase())) &&
      m.mois_label === moisLabel
  );

  // Find weekly performances for fallback/aggregation
  const weeklyPerfsList = store.getWeeklyPerformances();
  const agentWeeklyPerfs = weeklyPerfsList.filter(
    (w) => w.agent_id === agentId || w.log_activite === agent?.log_activite || w.agent_name === agentName
  );

  // Determine Ancienneté
  let anciennete: AncienneteType = agent?.anciennete || (monthlyMatch?.anciennete as AncienneteType) || '+ 3 mois';

  // Determine channels data
  let phoneMetrics: ChannelMetrics = { vol: 0, rap: 84.8, tr: 14.5, ccx: 93.0, dmt: 590 };
  let emailMetrics: ChannelMetrics = { vol: 0, rap: 85.5, tr: 20.0, ccx: 94.89, dmt: 542 };
  let muMetrics: ChannelMetrics = { vol: 0, rap: 86.2, tr: 14.5, ccx: 95.0, dmt: 660 };

  let presence = 100;
  let hasData = false;

  if (monthlyMatch) {
    hasData = true;
    presence = monthlyMatch.presence ?? 100;

    // Check if explicit channel metrics exist on monthlyMatch
    if (monthlyMatch.vol_phone != null || monthlyMatch.vol_email != null || monthlyMatch.vol_mu != null) {
      phoneMetrics = {
        vol: monthlyMatch.vol_phone || 0,
        rap: (monthlyMatch.rap_phone != null ? monthlyMatch.rap_phone : 0.848) * (monthlyMatch.rap_phone && monthlyMatch.rap_phone <= 1 ? 100 : 1),
        tr: (monthlyMatch.tr_phone != null ? monthlyMatch.tr_phone : 0.145) * (monthlyMatch.tr_phone && monthlyMatch.tr_phone <= 1 ? 100 : 1),
        ccx: (monthlyMatch.ccx_phone != null ? monthlyMatch.ccx_phone : 0.93) * (monthlyMatch.ccx_phone && monthlyMatch.ccx_phone <= 1 ? 100 : 1),
        dmt: monthlyMatch.dmt_phone || 590,
      };
      emailMetrics = {
        vol: monthlyMatch.vol_email || 0,
        rap: (monthlyMatch.rap_email != null ? monthlyMatch.rap_email : 0.855) * (monthlyMatch.rap_email && monthlyMatch.rap_email <= 1 ? 100 : 1),
        tr: (monthlyMatch.tr_email != null ? monthlyMatch.tr_email : 0.20) * (monthlyMatch.tr_email && monthlyMatch.tr_email <= 1 ? 100 : 1),
        ccx: (monthlyMatch.ccx_email != null ? monthlyMatch.ccx_email : 0.9489) * (monthlyMatch.ccx_email && monthlyMatch.ccx_email <= 1 ? 100 : 1),
        dmt: monthlyMatch.dmt_email || 542,
      };
      muMetrics = {
        vol: monthlyMatch.vol_mu || 0,
        rap: (monthlyMatch.rap_mu != null ? monthlyMatch.rap_mu : 0.862) * (monthlyMatch.rap_mu && monthlyMatch.rap_mu <= 1 ? 100 : 1),
        tr: (monthlyMatch.tr_mu != null ? monthlyMatch.tr_mu : 0.145) * (monthlyMatch.tr_mu && monthlyMatch.tr_mu <= 1 ? 100 : 1),
        ccx: (monthlyMatch.ccx_mu != null ? monthlyMatch.ccx_mu : 0.95) * (monthlyMatch.ccx_mu && monthlyMatch.ccx_mu <= 1 ? 100 : 1),
        dmt: monthlyMatch.dmt_mu || 660,
      };
    } else {
      // Derive channel volumes based on poids & vol_total
      const totalVol = monthlyMatch.vol_total || 1000;
      const poidsP = (monthlyMatch.poids_phone || 60) / 100;
      const poidsE = (monthlyMatch.poids_email || 25) / 100;
      const poidsM = (monthlyMatch.poids_mu || 15) / 100;

      phoneMetrics.vol = Math.round(totalVol * poidsP);
      emailMetrics.vol = Math.round(totalVol * poidsE);
      muMetrics.vol = Math.round(totalVol * poidsM);

      // Check if weekly perfs provide channel KPIs
      const phonePerfs = agentWeeklyPerfs.filter((p) => p.canal === 'Phone');
      const emailPerfs = agentWeeklyPerfs.filter((p) => p.canal === 'Email');
      const muPerfs = agentWeeklyPerfs.filter((p) => p.canal === 'MU');

      if (phonePerfs.length > 0) {
        phoneMetrics.rap = averageKpi(phonePerfs, 'rap', 84.8);
        phoneMetrics.tr = averageKpi(phonePerfs, 'tr', 14.5);
        phoneMetrics.ccx = averageKpi(phonePerfs, 'ccx', 93.0);
        phoneMetrics.dmt = averageKpi(phonePerfs, 'dmt', 590, false);
      } else {
        phoneMetrics.rap = 84.8;
        phoneMetrics.tr = 14.5;
        phoneMetrics.ccx = 93.0;
        phoneMetrics.dmt = 590;
      }

      if (emailPerfs.length > 0) {
        emailMetrics.rap = averageKpi(emailPerfs, 'rap', 85.5);
        emailMetrics.tr = averageKpi(emailPerfs, 'tr', 20.0);
        emailMetrics.ccx = averageKpi(emailPerfs, 'ccx', 94.89);
        emailMetrics.dmt = averageKpi(emailPerfs, 'dmt', 542, false);
      } else {
        emailMetrics.rap = 85.5;
        emailMetrics.tr = 20.0;
        emailMetrics.ccx = 94.89;
        emailMetrics.dmt = 542;
      }

      if (muPerfs.length > 0) {
        muMetrics.rap = averageKpi(muPerfs, 'rap', 86.2);
        muMetrics.tr = averageKpi(muPerfs, 'tr', 14.5);
        muMetrics.ccx = averageKpi(muPerfs, 'ccx', 95.0);
        muMetrics.dmt = averageKpi(muPerfs, 'dmt', 660, false);
      } else {
        muMetrics.rap = 86.2;
        muMetrics.tr = 14.5;
        muMetrics.ccx = 95.0;
        muMetrics.dmt = 660;
      }
    }
  } else if (agentWeeklyPerfs.length > 0) {
    hasData = true;
    const phonePerfs = agentWeeklyPerfs.filter((p) => p.canal === 'Phone');
    const emailPerfs = agentWeeklyPerfs.filter((p) => p.canal === 'Email');
    const muPerfs = agentWeeklyPerfs.filter((p) => p.canal === 'MU');

    const volP = sumVol(phonePerfs);
    const volE = sumVol(emailPerfs);
    const volM = sumVol(muPerfs);

    phoneMetrics = {
      vol: volP,
      rap: averageKpi(phonePerfs, 'rap', 84.8),
      tr: averageKpi(phonePerfs, 'tr', 14.5),
      ccx: averageKpi(phonePerfs, 'ccx', 93.0),
      dmt: averageKpi(phonePerfs, 'dmt', 590, false),
    };

    emailMetrics = {
      vol: volE,
      rap: averageKpi(emailPerfs, 'rap', 85.5),
      tr: averageKpi(emailPerfs, 'tr', 20.0),
      ccx: averageKpi(emailPerfs, 'ccx', 94.89),
      dmt: averageKpi(emailPerfs, 'dmt', 542, false),
    };

    muMetrics = {
      vol: volM,
      rap: averageKpi(muPerfs, 'rap', 86.2),
      tr: averageKpi(muPerfs, 'tr', 14.5),
      ccx: averageKpi(muPerfs, 'ccx', 95.0),
      dmt: averageKpi(muPerfs, 'dmt', 660, false),
    };

    // Calculate presence from weekly hours
    const totalPlanified = agentWeeklyPerfs.reduce((s, p) => s + (p.h_planifiees || 0), 0);
    const totalAbsence = agentWeeklyPerfs.reduce((s, p) => s + (p.h_absence || 0), 0);
    if (totalPlanified > 0) {
      presence = Math.round(((totalPlanified - totalAbsence) / totalPlanified) * 10000) / 100;
    }
  }

  const channelsData = {
    Phone: phoneMetrics,
    Email: emailMetrics,
    MU: muMetrics,
  };

  // Calculate real multicanal result
  const realResult = calculateMulticanalPrime(
    {
      Phone: {
        vol: phoneMetrics.vol,
        rap: phoneMetrics.rap / 100,
        tr: phoneMetrics.tr / 100,
        ccx: phoneMetrics.ccx / 100,
        dmt: phoneMetrics.dmt,
      },
      Email: {
        vol: emailMetrics.vol,
        rap: emailMetrics.rap / 100,
        tr: emailMetrics.tr / 100,
        ccx: emailMetrics.ccx / 100,
        dmt: emailMetrics.dmt,
      },
      MU: {
        vol: muMetrics.vol,
        rap: muMetrics.rap / 100,
        tr: muMetrics.tr / 100,
        ccx: muMetrics.ccx / 100,
        dmt: muMetrics.dmt,
      },
    },
    anciennete,
    presence
  );

  return {
    hasData,
    agentId,
    matricule,
    agentName,
    managerName: agent?.manager_name || monthlyMatch?.manager_name || 'SABI Prospere',
    moisLabel,
    anciennete,
    presence,
    channels: channelsData,
    realResult,
  };
}

function sumVol(perfs: any[]): number {
  return perfs.reduce((s, p) => s + (p.vol || 0), 0);
}

function averageKpi(perfs: any[], key: string, fallbackPct: number, isPct = true): number {
  const valid = perfs.filter((p) => p[key] != null && !isNaN(p[key]));
  if (valid.length === 0) return fallbackPct;

  let sum = 0;
  let totalVol = 0;
  valid.forEach((p) => {
    const vol = p.vol || 1;
    let val = Number(p[key]);
    if (isPct && val <= 1) val = val * 100;
    sum += val * vol;
    totalVol += vol;
  });

  return totalVol > 0 ? Math.round((sum / totalVol) * 100) / 100 : fallbackPct;
}
