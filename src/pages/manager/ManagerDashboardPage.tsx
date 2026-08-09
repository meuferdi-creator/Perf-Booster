import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, AlertTriangle, ArrowRight, UserPlus, Upload, BrainCircuit, Award } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { filterByManager } from '../../lib/perimeter';
import { Agent, MonthlyResult, WeeklyPerformance } from '../../types';
import { formatFCFA } from '../../lib/kpi-utils';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);
  const [weeklyPerfs, setWeeklyPerfs] = useState<WeeklyPerformance[]>([]);
  const [activeTab, setActiveTab] = useState<'top' | 'renforcer'>('top');

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const allAgents = store.getAgents();
      const allMonthly = store.getMonthlyResults();
      const allPerfs = store.getWeeklyPerformances();

      setAgents(filterByManager(allAgents));
      setMonthlyResults(filterByManager(allMonthly));
      setWeeklyPerfs(filterByManager(allPerfs));
    };

    update();
    return store.subscribe(update);
  }, []);

  const totalDistributed = monthlyResults.reduce((s, r) => s + (r.pv_finale || 0), 0);
  const avgPrime = monthlyResults.length > 0 ? Math.round(totalDistributed / monthlyResults.length) : 0;
  const aRenforcerCount = monthlyResults.filter((r) => r.statut === 'À renforcer').length;

  const topPerformers = [...monthlyResults].sort((a, b) => b.pv_finale - a.pv_finale).slice(0, 5);
  const aRenforcerList = [...monthlyResults].filter((r) => r.statut === 'À renforcer');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2.5 py-0.5 rounded-full border border-purple-700/50">
              Espace Management Support
            </span>
            <span className="text-2xs text-slate-400">· Juillet 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Vue d'ensemble · {auth?.name || 'SABI Prospere'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pilotage de la performance, distribution des primes et accompagnement de l'équipe ({agents.length} agents)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => navigate('/manager/import')}>
            Import
          </Button>
          <Button variant="primary" size="sm" icon={<BrainCircuit className="w-4 h-4" />} onClick={() => navigate('/manager/coaching')}>
            Coaching IA
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agents Supervisés</span>
            <div className="p-2 bg-purple-50 text-[#814BE7] rounded-xl dark:bg-purple-950/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{agents.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Activité Support Multicanal</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primes Distribuées</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/50">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatFCFA(totalDistributed)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Total Juillet 2026</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prime Moyenne / Agent</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl dark:bg-blue-950/50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatFCFA(avgPrime)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Par conseiller éligible</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agents À Renforcer</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-600">{aRenforcerCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Besoin d'accompagnement</span>
          </div>
        </Card>
      </div>

      {/* Rankings Section */}
      <Card noPadding>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Tabs
            tabs={[
              { id: 'top', label: 'Top Performers (Primes Elevées)', icon: <Award className="w-4 h-4" /> },
              { id: 'renforcer', label: `À Accompagner (${aRenforcerList.length})`, icon: <AlertTriangle className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Matricule RH</TableHead>
              <TableHead>Ancienneté</TableHead>
              <TableHead>Présence (%)</TableHead>
              <TableHead>Prime Finale (FCFA)</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {(activeTab === 'top' ? topPerformers : aRenforcerList).map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{r.agent_name}</TableCell>
                <TableCell>{r.matricule_rh}</TableCell>
                <TableCell>{r.anciennete}</TableCell>
                <TableCell>{r.presence}%</TableCell>
                <TableCell className="font-bold text-[#814BE7]">{formatFCFA(r.pv_finale)}</TableCell>
                <TableCell>
                  <Badge variant={r.statut === 'Objectif atteint' ? 'success' : r.statut === 'En progression' ? 'info' : 'warning'}>
                    {r.statut}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
