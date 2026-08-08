import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance } from '../../types';

export const ManagerAnalyticsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [selectedKpi, setSelectedKpi] = useState('rap');
  const [selectedCanal, setSelectedCanal] = useState('Phone');
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getWeeklyPerformances();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      setPerfs(all.filter((p) => p.manager_name === managerName));
    };

    update();
    return store.subscribe(update);
  }, []);

  // Aggregate team weekly trend
  const weeks = [27, 28, 29, 30, 31];
  const trendData = weeks.map((w) => {
    const weekPerfs = perfs.filter((p) => p.semaine === w && p.canal === selectedCanal);
    const sum = weekPerfs.reduce((acc, p) => acc + ((p as any)[selectedKpi] || 0), 0);
    const avg = weekPerfs.length > 0 ? sum / weekPerfs.length : 0;

    return {
      semaine: `S${w}`,
      moyenneEquipe: selectedKpi === 'dmt' ? Math.round(avg) : Number((avg * 100).toFixed(1)),
    };
  });

  // Agent comparison for S31
  const s31Perfs = perfs.filter((p) => p.semaine === 31 && p.canal === selectedCanal);
  const agentBarData = s31Perfs.map((p) => ({
    agent: p.agent_name.split(' ')[0],
    valeur: selectedKpi === 'dmt' ? p.dmt : Number(((p as any)[selectedKpi] * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Analyses Avancées & Benchmarking</h1>
        <p className="text-xs text-slate-500">
          Visualisation de la moyenne d'équipe et comparaison inter-conseillers sur l'ensemble des métriques
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          label="Canal d'Activité"
          value={selectedCanal}
          onChange={(e) => setSelectedCanal(e.target.value)}
          options={[
            { value: 'Phone', label: 'Phone' },
            { value: 'Email', label: 'Email' },
            { value: 'MU', label: 'MU' },
          ]}
        />

        <Select
          label="Indicateur (KPI)"
          value={selectedKpi}
          onChange={(e) => setSelectedKpi(e.target.value)}
          options={[
            { value: 'rap', label: 'RAP (%)' },
            { value: 'tr', label: 'TR (%)' },
            { value: 'ccx', label: 'CCX (%)' },
            { value: 'dmt', label: 'DMT (secondes)' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Line Chart */}
        <Card>
          <h3 className="font-bold text-sm text-slate-900 mb-4">
            Moyenne Équipe Hebdomadaire ({selectedCanal} - {selectedKpi.toUpperCase()})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="moyenneEquipe" stroke="#814BE7" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Agent Comparison Bar Chart */}
        <Card>
          <h3 className="font-bold text-sm text-slate-900 mb-4">
            Comparatif Agents S31 ({selectedCanal} - {selectedKpi.toUpperCase()})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="agent" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="valeur" fill="#814BE7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
