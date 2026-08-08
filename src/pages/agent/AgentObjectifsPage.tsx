import React, { useState, useEffect } from 'react';
import { Target, Award, ArrowUpRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { ObjectiveKpiCard } from '../../components/agent/ObjectiveKpiCard';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { CanalType, WeeklyPerformance } from '../../types';
import { getKpiTarget, KPI_KEYS } from '../../lib/kpi-utils';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Mes Objectifs & Cibles</h1>
        <p className="text-xs text-slate-500">
          Suivi de la progression vers les paliers de primes 100% et 110% (Grille de performance)
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
    </div>
  );
};
