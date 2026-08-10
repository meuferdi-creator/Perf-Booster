import React, { useState, useEffect } from 'react';
import { Target, Award, ArrowUpRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { ObjectiveKpiCard } from '../../components/agent/ObjectiveKpiCard';
import { KpiContributionsTable } from '../../components/agent/KpiContributionsTable';
import { PrimeImpactCard } from '../../components/agent/PrimeImpactCard';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { CanalType, WeeklyPerformance } from '../../types';
import { getKpiTarget, KPI_KEYS, getTargets, calculateMulticanalPrime } from '../../lib/kpi-utils';

export const AgentObjectifsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [selectedCanal, setSelectedCanal] = useState<CanalType>('Phone');
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getWeeklyPerformances();
      const agentId = currentAuth?.id || 'agent-1163';
      setPerfs(all.filter((p) => p.agent_id === agentId || p.log_activite === currentAuth?.log_activite));
    };

    update();
    return store.subscribe(update);
  }, []);

  const channelPerfs = perfs.filter((p) => p.canal === selectedCanal);
  const currentPerf = channelPerfs.find((p) => p.semaine === 31) || channelPerfs[0];
  const anciennete = auth?.anciennete || '+ 3 mois';
  const targets = getTargets(anciennete);

  // Compute multicanal breakdown for Prime impact card
  const phoneP = perfs.find((p) => p.canal === 'Phone');
  const emailP = perfs.find((p) => p.canal === 'Email');
  const muP = perfs.find((p) => p.canal === 'MU');

  const multiRes = calculateMulticanalPrime(
    {
      Phone: { vol: phoneP?.vol || 408, rap: phoneP?.rap, tr: phoneP?.tr, ccx: phoneP?.ccx, dmt: phoneP?.dmt },
      Email: { vol: emailP?.vol || 215, rap: emailP?.rap, tr: emailP?.tr, ccx: emailP?.ccx, dmt: emailP?.dmt },
      MU: { vol: muP?.vol || 114, rap: muP?.rap, tr: muP?.tr, ccx: muP?.ccx, dmt: muP?.dmt },
    },
    anciennete,
    currentPerf?.presence || 99.7
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Mes Objectifs & Cibles</h1>
        <p className="text-xs text-slate-500">
          Suivi de la progression vers les paliers de primes 100% et 110%, détails des contributions et impact assiduité
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'Phone', label: 'Phone' },
          { id: 'Email', label: 'Email' },
          { id: 'MU', label: 'MU' },
        ]}
        activeTab={selectedCanal}
        onChange={(id) => setSelectedCanal(id as CanalType)}
      />

      {/* 1. Individual KPI Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {KPI_KEYS.map((k) => {
          const detail = getKpiTarget(selectedCanal, anciennete, k);
          const val = currentPerf ? (currentPerf as any)[k] : null;

          return (
            <ObjectiveKpiCard
              key={k}
              kpiKey={k}
              currentValue={val}
              target100={detail?.s100 || 0}
              target110={detail?.s110}
            />
          );
        })}
      </div>

      {/* 2. Weighted Contributions Breakdown Table */}
      <KpiContributionsTable
        canal={selectedCanal}
        anciennete={anciennete}
        perf={currentPerf}
        targets={targets}
        volume={currentPerf?.vol || 408}
        poidsActes={multiRes.poids[selectedCanal] ? multiRes.poids[selectedCanal] * 100 : undefined}
      />

      {/* 3. Presence / Absence & Prime Impact Card */}
      <PrimeImpactCard
        agentName={auth?.nom_complet || 'Agent Support'}
        pvSansPresence={multiRes.pvSansPresence || 34200}
        presencePct={currentPerf?.presence || 99.7}
        hPlanifiees={currentPerf?.h_planifiees || 160}
        hAbsence={currentPerf?.h_absence || 0.5}
        hEffectuees={currentPerf?.h_effectuees || 159.5}
      />
    </div>
  );
};
