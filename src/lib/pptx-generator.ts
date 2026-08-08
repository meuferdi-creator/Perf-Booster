import pptxgen from 'pptxgenjs';
import { MonthlyResult } from '../types';
import { formatFCFA } from './kpi-utils';

export function exportMonthlyResultsToPPTX(results: MonthlyResult[], title = 'Synthèse des Primes Mensuelles Support Multicanal') {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';

  // Slide 1: Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: '814BE7' };

  slide1.addText('PERFORMANCES BOOSTER', {
    x: 1.0,
    y: 2.0,
    w: 11.0,
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Helvetica',
  });

  slide1.addText(title, {
    x: 1.0,
    y: 3.0,
    w: 11.0,
    h: 0.8,
    fontSize: 22,
    color: 'E9D8FD',
    fontFace: 'Helvetica',
  });

  slide1.addText(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Activité Support Multicanal`, {
    x: 1.0,
    y: 5.5,
    w: 11.0,
    h: 0.5,
    fontSize: 14,
    color: 'D6BCFA',
  });

  // Slide 2: Table Summary
  const slide2 = pptx.addSlide();
  slide2.addText('Résultats Mensuels & Distribution des Primes', {
    x: 0.8,
    y: 0.5,
    w: 11.0,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: '333333',
  });

  const rows: any[][] = [
    [
      { text: 'Agent', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
      { text: 'Matricule', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
      { text: 'Vol. Total', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
      { text: 'Présence', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
      { text: 'Prime Finale', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
      { text: 'Statut', options: { bold: true, fill: 'F3F0FD', color: '5A20B3' } },
    ],
  ];

  results.slice(0, 10).forEach((r) => {
    rows.push([
      { text: r.agent_name },
      { text: r.matricule_rh || '—' },
      { text: r.vol_total.toString() },
      { text: `${r.presence}%` },
      { text: formatFCFA(r.pv_finale), options: { bold: true } },
      { text: r.statut },
    ]);
  });

  slide2.addTable(rows, {
    x: 0.8,
    y: 1.3,
    w: 11.5,
    colW: [3.2, 1.5, 1.5, 1.5, 2.0, 1.8],
    fontSize: 12,
    border: { pt: 0.5, color: 'E2E8F0' },
  });

  pptx.writeFile({ fileName: 'Resultats_Mensuels_Performances_Booster.pptx' });
}
