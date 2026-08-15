import React, { useState, useEffect } from 'react';
import { Calendar, Award, Sparkles, ArrowUpRight, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/agent/KpiCard';
import { ScoreCircle } from '../../components/agent/ScoreCircle';
import { EvolutionChart } from '../../components/agent/EvolutionChart';
import { ComparativeKpiChart } from '../../components/agent/ComparativeKpiChart';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { CanalType, WeeklyPerformance, MonthlyResult } from '../../types';
import {
  calculatePerformanceScore,
  formatFCFA,
  getStatutStyle,
  getTargets,
  primeForKpi,
} from '../../lib/kpi-utils';

export const AgentDashboardPage: React.FC = () => {
  const auth = getStoredAuth();
  const [selectedCanal, setSelectedCanal] = useState<CanalType>('Phone');
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);
  const [monthlyRes, setMonthlyRes] = useState<MonthlyResult | null>(null);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const allPerfs = store.getWeeklyPerformances();
      const allMonthly = store.getMonthlyResults();

      const agentId = currentAuth?.id;
      const myPerfs = allPerfs.filter(
        (p) =>
          (agentId && p.agent_id === agentId) ||
          (currentAuth?.log_activite && p.log_activite === currentAuth.log_activite)
      );
      setPerfs(myPerfs);

      const myMonth = allMonthly.find(
        (m) =>
          (agentId && m.agent_id === agentId) ||
          (currentAuth?.matricule && m.matricule_rh === currentAuth.matricule)
      );
      setMonthlyRes(myMonth || null);
    };

    update();
    return store.subscribe(update);
  }, []);

  // Current latest week performance for selected channel
  const channelPerfs = perfs.filter((p) => p.canal === selectedCanal);
  const currentPerf = channelPerfs.find((p) => p.semaine === 32) || channelPerfs.find((p) => p.semaine === 31) || channelPerfs[0];
  const prevPerf = channelPerfs.find((p) => p.semaine === 31 && currentPerf?.semaine === 32) || channelPerfs.find((p) => p.semaine === 30);

  const targets = getTargets(auth?.anciennete || '+ 3 mois');
  const score = calculatePerformanceScore(currentPerf, targets);

  const statusStyle = getStatutStyle(monthlyRes?.statut);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
              Agent Support
            </span>
            <span className="text-2xs text-slate-400">· Semaine {currentPerf?.semaine || 32}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Bonjour, {auth?.prenom || 'Shalom'} 👋
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Voici votre bilan hebdomadaire et vos progressions de primes multicanal.
          </p>
        </div>

        {monthlyRes && (
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 shrink-0">
            <div>
              <span className="text-3xs text-indigo-200 uppercase tracking-wider block font-bold">
                Prime Estimée {monthlyRes.mois_label}
              </span>
              <span className="text-2xl font-black text-white">{formatFCFA(monthlyRes.pv_finale)}</span>
            </div>
            <Badge variant="purple" className="bg-[#814BE7] text-white border-none">
              {monthlyRes.statut}
            </Badge>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: KPIs & Evolution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channel Selector */}
          <div className="flex items-center justify-between">
            <Tabs
              tabs={[
                { id: 'Phone', label: 'Phone' },
                { id: 'Email', label: 'Email' },
                { id: 'MU', label: 'MU' },
              ]}
              activeTab={selectedCanal}
              onChange={(id) => setSelectedCanal(id as CanalType)}
            />
            <span className="text-xs text-slate-400 hidden sm:inline">Ancienneté: {auth?.anciennete || '+ 3 mois'}</span>
          </div>

          {/* 4 Core KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              kpiKey="rap"
              value={currentPerf?.rap}
              target={targets.rap}
              prevValue={prevPerf?.rap}
              primePotentielle={primeForKpi(currentPerf?.rap, selectedCanal, auth?.anciennete || '+ 3 mois', 'rap')}
            />
            <KpiCard
              kpiKey="tr"
              value={currentPerf?.tr}
              target={targets.tr}
              prevValue={prevPerf?.tr}
              primePotentielle={primeForKpi(currentPerf?.tr, selectedCanal, auth?.anciennete || '+ 3 mois', 'tr')}
            />
            <KpiCard
              kpiKey="ccx"
              value={currentPerf?.ccx}
              target={targets.ccx}
              prevValue={prevPerf?.ccx}
              primePotentielle={primeForKpi(currentPerf?.ccx, selectedCanal, auth?.anciennete || '+ 3 mois', 'ccx')}
            />
            <KpiCard
              kpiKey="dmt"
              value={currentPerf?.dmt}
              target={targets.dmt}
              prevValue={prevPerf?.dmt}
              primePotentielle={primeForKpi(currentPerf?.dmt, selectedCanal, auth?.anciennete || '+ 3 mois', 'dmt')}
            />
          </div>

          {/* Weekly Evolution Chart */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Évolution Hebdomadaire ({selectedCanal})
                </h3>
                <p className="text-xs text-slate-500">Tendance sur les 5 dernières semaines</p>
              </div>
            </div>
            <EvolutionChart data={channelPerfs} kpiKey="rap" target={targets.rap} />
          </Card>
        </div>

        {/* Right 1 Col: Score Gauge, Manager Feedback & Comparative */}
        <div className="space-y-6">
          {/* Performance Score Gauge */}
          <Card className="flex flex-col items-center justify-center text-center p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Indice Global de Qualité (S31)
            </h3>
            <ScoreCircle score={score} size={140} />
            <p className="text-xs text-slate-500 mt-4">
              Calculé à partir de la conformité globale sur les 4 critères de performance.
            </p>
          </Card>

          {/* Latest Manager Feedback */}
          {currentPerf?.feedback && (
            <Card className="border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/30">
              <div className="flex items-center gap-2 text-xs font-bold text-[#814BE7] dark:text-purple-400 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span>Dernier Feedback Manager</span>
              </div>
              <p className="text-xs text-slate-700 italic dark:text-slate-300">
                "{currentPerf.feedback}"
              </p>
              <div className="mt-3 pt-2 border-t border-indigo-100/60 dark:border-indigo-900/40 flex justify-between items-center text-3xs text-slate-400">
                <span>Par: {currentPerf.manager_name}</span>
                <span>Semaine {currentPerf.semaine}</span>
              </div>
            </Card>
          )}

          {/* Comparative KPI Bar Chart */}
          <Card>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Positionnement / Moyenne Équipe
            </h3>
            <ComparativeKpiChart
              agentData={{ rap: currentPerf?.rap || 0, tr: currentPerf?.tr || 0, ccx: currentPerf?.ccx || 0 }}
              teamAvgData={{ rap: 0.83, tr: 0.15, ccx: 0.92 }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
