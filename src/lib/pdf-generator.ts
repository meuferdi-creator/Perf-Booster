import { jsPDF } from 'jspdf';
import { MonthlyResult, WeeklyPerformance } from '../types';
import { formatFCFA } from './kpi-utils';

export function exportMonthlyResultsToPDF(results: MonthlyResult[], title = 'Rapport des Primes Mensuelles - Performances Booster') {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(129, 75, 231); // #814BE7
  doc.text('PERFORMANCES BOOSTER', 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(title, 14, 26);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - Activité Support Multicanal`, 14, 32);

  // Table Headers
  const headers = ['Agent', 'Matricule', 'Poids (Ph/Em/MU)', 'PV Brute', 'Présence', 'PV Finale', 'Statut'];
  const startY = 42;
  const colWidths = [50, 25, 45, 35, 25, 35, 35];
  let currentY = startY;

  doc.setFillColor(243, 240, 253);
  doc.rect(14, currentY - 5, 260, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  let startX = 14;
  headers.forEach((h, i) => {
    doc.text(h, startX, currentY);
    startX += colWidths[i];
  });

  currentY += 8;
  doc.setFont('helvetica', 'normal');

  results.forEach((r, idx) => {
    if (currentY > 185) {
      doc.addPage();
      currentY = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 252);
      doc.rect(14, currentY - 5, 260, 7, 'F');
    }

    let x = 14;
    doc.text(r.agent_name.substring(0, 26), x, currentY); x += colWidths[0];
    doc.text(r.matricule_rh || '—', x, currentY); x += colWidths[1];
    const weights = `${r.poids_phone ?? 0}% / ${r.poids_email ?? 0}% / ${r.poids_mu ?? 0}%`;
    doc.text(weights, x, currentY); x += colWidths[2];
    doc.text(formatFCFA(r.pv_sans_presence), x, currentY); x += colWidths[3];
    doc.text(`${r.presence}%`, x, currentY); x += colWidths[4];
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatFCFA(r.pv_finale), x, currentY); x += colWidths[5];
    doc.setFont('helvetica', 'normal');
    doc.text(r.statut, x, currentY);

    currentY += 7;
  });

  // Total Summary
  const totalPV = results.reduce((s, r) => s + (r.pv_finale || 0), 0);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(129, 75, 231);
  doc.text(`TOTAL PRIMES DISTRIBUÉES : ${formatFCFA(totalPV)} (${results.length} agents)`, 14, currentY);

  doc.save('Resultats_Mensuels_Performances_Booster.pdf');
}
