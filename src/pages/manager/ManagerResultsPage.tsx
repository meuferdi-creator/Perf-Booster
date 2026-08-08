import React, { useState, useEffect } from 'react';
import { History, Search, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { ResultsEditDialog } from '../../components/manager/ResultsEditDialog';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance, MonthlyResult } from '../../types';
import { formatFCFA, formatKpiValue } from '../../lib/kpi-utils';

export const ManagerResultsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [view, setView] = useState<'hebdo' | 'mensuel'>('hebdo');
  const [weeklyPerfs, setWeeklyPerfs] = useState<WeeklyPerformance[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);
  const [search, setSearch] = useState('');

  const [editingPerf, setEditingPerf] = useState<WeeklyPerformance | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const allW = store.getWeeklyPerformances();
      const allM = store.getMonthlyResults();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';

      setWeeklyPerfs(allW.filter((p) => p.manager_name === managerName));
      setMonthlyResults(allM.filter((m) => m.manager_name === managerName));
    };

    update();
    return store.subscribe(update);
  }, []);

  const handleDeleteWeekly = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement hebdomadaire ?')) {
      store.deleteWeeklyPerformance(id);
    }
  };

  const handleEditWeekly = (p: WeeklyPerformance) => {
    setEditingPerf(p);
    setIsEditDialogOpen(true);
  };

  const filteredWeekly = weeklyPerfs.filter(
    (p) =>
      p.agent_name.toLowerCase().includes(search.toLowerCase()) ||
      p.log_activite.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Historique & Journal des Résultats</h1>
          <p className="text-xs text-slate-500">
            Consultation, modification et audit des données brutes saisies ou importées
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'hebdo', label: 'Performances Hebdomadaires' },
            { id: 'mensuel', label: 'Ajustements Mensuels' },
          ]}
          activeTab={view}
          onChange={(id) => setView(id as any)}
        />
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Input
            placeholder="Rechercher par nom d'agent ou log..."
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {view === 'hebdo' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semaine</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>RAP (%)</TableHead>
                <TableHead>TR (%)</TableHead>
                <TableHead>CCX (%)</TableHead>
                <TableHead>DMT (s)</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {filteredWeekly.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-[#814BE7]">S{p.semaine}</TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{p.agent_name}</TableCell>
                  <TableCell>{p.canal}</TableCell>
                  <TableCell>{formatKpiValue('rap', p.rap)}</TableCell>
                  <TableCell>{formatKpiValue('tr', p.tr)}</TableCell>
                  <TableCell>{formatKpiValue('ccx', p.ccx)}</TableCell>
                  <TableCell>{formatKpiValue('dmt', p.dmt)}</TableCell>
                  <TableCell>{p.vol ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditWeekly(p)}
                        className="p-1.5 text-slate-400 hover:text-[#814BE7] hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWeekly(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>PV Brute</TableHead>
                <TableHead>Présence</TableHead>
                <TableHead>PV Finale (FCFA)</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {monthlyResults.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-bold">{m.mois_label}</TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{m.agent_name}</TableCell>
                  <TableCell>{m.matricule_rh}</TableCell>
                  <TableCell>{formatFCFA(m.pv_sans_presence)}</TableCell>
                  <TableCell>{m.presence}%</TableCell>
                  <TableCell className="font-bold text-[#814BE7]">{formatFCFA(m.pv_finale)}</TableCell>
                  <TableCell>{m.statut}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ResultsEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        perf={editingPerf}
      />
    </div>
  );
};
