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

export function exportWeeklyPerfsToExcel(perfs: WeeklyPerformance[], filename = 'Performances_Hebdo_14_Colonnes.xlsx') {
  const data = perfs.map((p) => ({
    'LOG': p.log_activite || p.agent_name,
    'YES': p.yes ?? '—',
    'NO': p.no ?? '—',
    'RAP': p.rap != null ? `${(p.rap * 100).toFixed(1)}%` : '—',
    'YES cumul Mois': p.yes_cumul_mois ?? '—',
    'NO cumul Mois': p.no_cumul_mois ?? '—',
    'RAP Mois': p.rap_mois != null ? `${(p.rap_mois * 100).toFixed(1)}%` : '—',
    'Besoin en OUI': p.besoin_oui ?? 0,
    'CCX': p.ccx != null ? `${(p.ccx * 100).toFixed(1)}%` : '—',
    'TR': p.tr != null ? `${(p.tr * 100).toFixed(1)}%` : '—',
    'DMT Mois': p.dmt != null ? Math.round(p.dmt) : '—',
    'Vol Phone': p.vol ?? '—',
    'H planifiées': p.h_planifiees ?? '—',
    'H absence': p.h_absence ?? '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Performances 14 Colonnes');
  XLSX.writeFile(workbook, filename);
}

export function download14ColMatrixTemplate(filename = 'Matrice_Import_Performance_14_Colonnes.xlsx') {
  const headers = [
    'LOG',
    'YES',
    'NO',
    'RAP',
    'YES cumul Mois',
    'NO cumul Mois',
    'RAP Mois',
    'Besoin en OUI',
    'CCX',
    'TR',
    'DMT Mois',
    'Vol Phone',
    'H planifiées',
    'H absence',
  ];
  const exampleRow = [
    'lom_tatounou',
    45,
    5,
    '90.0%',
    180,
    20,
    '90.0%',
    0,
    '92.0%',
    '12.5%',
    '05:30',
    450,
    40,
    0,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matrice 14 Colonnes');
  XLSX.writeFile(workbook, filename);
}
