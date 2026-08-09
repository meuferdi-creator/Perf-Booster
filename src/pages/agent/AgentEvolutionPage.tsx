import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EvolutionChart } from '../../components/agent/EvolutionChart';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { CanalType, WeeklyPerformance } from '../../types';
import { formatKpiValue, getTargets, getKpiStatus, calculateAssiduiteFromPerf } from '../../lib/kpi-utils';

export const AgentEvolutionPage: React.FC = () => {
  const auth = getStoredAuth();
  const [selectedCanal, setSelectedCanal] = useState<CanalType>('Phone');
  const [selectedKpi, setSelectedKpi] = useState('rap');
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

  const channelPerfs = perfs.filter((p) => p.canal === selectedCanal).sort((a, b) => b.semaine - a.semaine);
  const targets = getTargets(auth?.anciennete || '+ 3 mois');

  const renderCellWithStatus = (kpiKey: string, val: number | null | undefined, targetVal: number) => {
    const status = getKpiStatus(val, targetVal, kpiKey);
    const colorClass =
      status === 'success'
        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
        : status === 'warning'
        ? 'text-amber-700 bg-amber-50 border border-amber-200'
        : status === 'danger'
        ? 'text-rose-700 bg-rose-50 border border-rose-200'
        : 'text-slate-600 bg-slate-50';

    return (
      <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${colorClass}`}>
        {formatKpiValue(kpiKey, val)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Évolution de la Performance</h1>
        <p className="text-xs text-slate-500">Historique détaillé et progression sur plusieurs semaines</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'Phone', label: 'Phone' },
            { id: 'Email', label: 'Email' },
            { id: 'MU', label: 'MU' },
          ]}
          activeTab={selectedCanal}
          onChange={(id) => setSelectedCanal(id as CanalType)}
        />

        <div className="w-full sm:w-64">
          <Select
            label="Métrique à analyser"
            value={selectedKpi}
            onChange={(e) => setSelectedKpi(e.target.value)}
            options={[
              { value: 'rap', label: 'RAP (Résolution au 1er contact)' },
              { value: 'tr', label: 'TR (Taux de Transfert)' },
              { value: 'ccx', label: 'CCX (Customer Contact Exp.)' },
              { value: 'dmt', label: 'DMT (Durée de traitement)' },
              { value: 'assiduite', label: 'Assiduité (Taux de Présence)' },
            ]}
          />
        </div>
      </div>

      {/* Chart Card */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
          Graphe de tendance ({selectedCanal} - {selectedKpi.toUpperCase()})
        </h3>
        <EvolutionChart data={channelPerfs} kpiKey={selectedKpi} target={(targets as any)[selectedKpi]} />
      </Card>

      {/* Multi-week Table */}
      <Card noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Historique Hebdomadaire Data</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semaine</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>RAP (%)</TableHead>
              <TableHead>TR (%)</TableHead>
              <TableHead>CCX (%)</TableHead>
              <TableHead>DMT (s)</TableHead>
              <TableHead>Assiduité</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {channelPerfs.map((p) => {
              const assid = calculateAssiduiteFromPerf(p);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-bold text-[#814BE7]">Semaine {p.semaine}</TableCell>
                  <TableCell>{p.canal}</TableCell>
                  <TableCell>{renderCellWithStatus('rap', p.rap, targets.rap)}</TableCell>
                  <TableCell>{renderCellWithStatus('tr', p.tr, targets.tr)}</TableCell>
                  <TableCell>{renderCellWithStatus('ccx', p.ccx, targets.ccx)}</TableCell>
                  <TableCell>{renderCellWithStatus('dmt', p.dmt, targets.dmt)}</TableCell>
                  <TableCell>{renderCellWithStatus('assiduite', assid != null ? assid / 100 : null, 0.95)}</TableCell>
                  <TableCell className="font-semibold">{p.vol ?? '—'}</TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
