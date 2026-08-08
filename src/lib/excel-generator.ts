import * as XLSX from 'xlsx';
import { MonthlyResult, WeeklyPerformance } from '../types';
import { formatFCFA } from './kpi-utils';

export function exportMonthlyResultsToExcel(results: MonthlyResult[], filename = 'Resultats_Mensuels_Performances_Booster.xlsx') {
  const data = results.map((r) => ({
    'Matricule RH': r.matricule_rh,
    'Nom Agent': r.agent_name,
    'Manager': r.manager_name,
    'Mois': r.mois_label,
    'Ancienneté': r.anciennete,
    'Vol. Total': r.vol_total,
    'Poids Phone (%)': r.poids_phone ?? '—',
    'Poids Email (%)': r.poids_email ?? '—',
    'Poids MU (%)': r.poids_mu ?? '—',
    'PV Sans Présence (FCFA)': r.pv_sans_presence,
    'Présence (%)': `${r.presence}%`,
    'PV Finale (FCFA)': r.pv_finale,
    'Statut': r.statut,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Résultats Mensuels');
  XLSX.writeFile(workbook, filename);
}

export function exportWeeklyPerfsToExcel(perfs: WeeklyPerformance[], filename = 'Performances_Hebdo_Performances_Booster.xlsx') {
  const data = perfs.map((p) => ({
    'Semaine': `S${p.semaine} ${p.annee}`,
    'Agent': p.agent_name,
    'Manager': p.manager_name,
    'Canal': p.canal,
    'LOG Activité': p.log_activite,
    'RAP': p.rap != null ? `${(p.rap * 100).toFixed(1)}%` : '—',
    'TR': p.tr != null ? `${(p.tr * 100).toFixed(1)}%` : '—',
    'CCX': p.ccx != null ? `${(p.ccx * 100).toFixed(1)}%` : '—',
    'DMT (s)': p.dmt != null ? Math.round(p.dmt) : '—',
    'Volume': p.vol ?? '—',
    'Heures Planifiées': p.h_planifiees ?? '—',
    'Heures Absence': p.h_absence ?? '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performances Hebdo');
  XLSX.writeFile(workbook, filename);
}
