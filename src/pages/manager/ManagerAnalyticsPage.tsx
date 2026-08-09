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
import { filterByManager } from '../../lib/perimeter';
import { WeeklyPerformance } from '../../types';
import { calculateAssiduiteFromPerf } from '../../lib/kpi-utils';
import { useTheme } from '../../context/ThemeContext';

export const ManagerAnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const auth = getStoredAuth();
  const [selectedKpi, setSelectedKpi] = useState('rap');
  const [selectedCanal, setSelectedCanal] = useState('Phone');
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const all = store.getWeeklyPerformances();
      setPerfs(filterByManager(all));
    };

    update();
    return store.subscribe(update);
  }, []);

  const getKpiVal = (p: WeeklyPerformance) => {
    if (selectedKpi === 'assiduite' || selectedKpi === 'presence') {
      const val = calculateAssiduiteFromPerf(p);
      return val != null ? val : 0;
    }
    const raw = (p as any)[selectedKpi];
    if (raw == null || isNaN(raw)) return 0;
    return selectedKpi === 'dmt' ? raw : raw <= 1 ? raw * 100 : raw;
  };

  // Aggregate team weekly trend
  const weeks = [27, 28, 29, 30, 31];
  const trendData = weeks.map((w) => {
    const weekPerfs = perfs.filter((p) => p.semaine === w && p.canal === selectedCanal);
    const sum = weekPerfs.reduce((acc, p) => acc + getKpiVal(p), 0);
    const avg = weekPerfs.length > 0 ? sum / weekPerfs.length : 0;

    return {
      semaine: `S${w}`,
      moyenneEquipe: selectedKpi === 'dmt' ? Math.round(avg) : Number(avg.toFixed(1)),
    };
  });

  // Agent comparison for S31
  const s31Perfs = perfs.filter((p) => p.semaine === 31 && p.canal === selectedCanal);
  const agentBarData = s31Perfs.map((p) => ({
    agent: p.agent_name.split(' ')[0],
    valeur: Number(getKpiVal(p).toFixed(1)),
  }));

  const textColor = isDark ? '#CBD5E1' : '#334155';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#814BE7]" /> Analyses Avancées & Benchmarking
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            { value: 'assiduite', label: 'Assiduité (%)' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Line Chart */}
        <Card>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#814BE7]" /> Moyenne Équipe Hebdomadaire ({selectedCanal} - {selectedKpi.toUpperCase()})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="semaine" tick={{ fontSize: 11, fill: textColor, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11, fill: textColor, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    color: textColor,
                    borderRadius: '12px',
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Line type="monotone" dataKey="moyenneEquipe" stroke="#814BE7" strokeWidth={3} dot={{ r: 5, fill: '#814BE7', stroke: isDark ? '#0F172A' : '#FFFFFF', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Agent Comparison Bar Chart */}
        <Card>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#814BE7]" /> Comparatif Agents S31 ({selectedCanal} - {selectedKpi.toUpperCase()})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="agent" tick={{ fontSize: 11, fill: textColor, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11, fill: textColor, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    color: textColor,
                    borderRadius: '12px',
                    border: `1px solid ${tooltipBorder}`,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Bar dataKey="valeur" fill="#814BE7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
