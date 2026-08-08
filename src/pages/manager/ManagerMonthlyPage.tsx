import React, { useState, useEffect } from 'react';
import { CalendarDays, Upload, DollarSign, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { MonthlyResult } from '../../types';
import { formatFCFA } from '../../lib/kpi-utils';

export const ManagerMonthlyPage: React.FC = () => {
  const auth = getStoredAuth();
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getMonthlyResults();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      setMonthlyResults(all.filter((m) => m.manager_name === managerName));
    };

    update();
    return store.subscribe(update);
  }, []);

  const handleMonthlyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const newResults: MonthlyResult[] = data.map((row, idx) => ({
          id: `mres-imp-${Date.now()}-${idx}`,
          mois_key: '2026-07',
          mois_annee: '2026-07',
          mois_label: 'Juillet 2026',
          annee: 2026,
          numero_mois: 7,
          agent_id: row['agent_id'] || `agent-${idx}`,
          agent_name: row['Agent'] || row['Nom'] || 'Agent Support',
          matricule_rh: row['Matricule'] || '1000',
          manager_name: auth?.manager_name || 'SABI Prospere',
          anciennete: row['Ancienneté'] || '+ 3 mois',
          vol_total: Number(row['Volume'] || 500),
          poids_phone: Number(row['Poids Phone'] || 60),
          poids_email: Number(row['Poids Email'] || 25),
          poids_mu: Number(row['Poids MU'] || 15),
          contrib_phone: Number(row['Contrib Phone'] || 15000),
          contrib_email: Number(row['Contrib Email'] || 5000),
          contrib_mu: Number(row['Contrib MU'] || 3000),
          pv_sans_presence: Number(row['PV Brute'] || 23000),
          presence: Number(row['Présence (%)'] || 100),
          pv_finale: Number(row['PV Finale'] || 23000),
          statut: row['Statut'] || 'En progression',
        }));

        store.saveMonthlyResultsBatch(newResults);
        alert(`${newResults.length} résultats mensuels importés avec succès !`);
      } catch (err) {
        console.error('Error importing monthly file:', err);
        alert('Erreur lors de l\'importation du fichier mensuel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const totalMonthlySum = monthlyResults.reduce((s, r) => s + r.pv_finale, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Gestion Mensuelle des Primes</h1>
          <p className="text-xs text-slate-500">
            Validation finale et arrêtés de comptes pour le mois de Juillet 2026
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#814BE7] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#6f3cd1]">
          <Upload className="w-4 h-4" />
          <span>Importer le fichier mensuel Excel/CSV</span>
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleMonthlyFileUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Total Primes Juil 2026</span>
          <span className="text-2xl font-black text-[#814BE7]">{formatFCFA(totalMonthlySum)}</span>
        </Card>

        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Nombre d'Agents Validés</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{monthlyResults.length}</span>
        </Card>

        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Période d'Arrêté</span>
          <span className="text-2xl font-black text-emerald-600">Juillet 2026</span>
        </Card>
      </div>

      <Card noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Matricule</TableHead>

              <TableHead>Volume</TableHead>
              <TableHead>PV Brute</TableHead>
              <TableHead>Présence</TableHead>
              <TableHead>PV Finale (FCFA)</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {monthlyResults.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{r.agent_name}</TableCell>
                <TableCell>{r.matricule_rh}</TableCell>

                <TableCell>{r.vol_total}</TableCell>
                <TableCell>{formatFCFA(r.pv_sans_presence)}</TableCell>
                <TableCell className="font-semibold text-emerald-600">{r.presence}%</TableCell>
                <TableCell className="font-bold text-[#814BE7]">{formatFCFA(r.pv_finale)}</TableCell>
                <TableCell>
                  <Badge variant={r.statut === 'Objectif atteint' ? 'success' : 'info'}>{r.statut}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
