import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { WeeklyPerformance } from '../../types';
import { KPI_LABELS, LOWER_IS_BETTER } from '../../lib/kpi-utils';

interface EvolutionChartProps {
  data: WeeklyPerformance[];
  kpiKey: string;
  target?: number;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data, kpiKey, target }) => {
  const isPercentage = ['rap', 'tr', 'ccx'].includes(kpiKey);

  const chartData = [...data]
    .sort((a, b) => a.semaine - b.semaine)
    .map((p) => {
      const val = (p as any)[kpiKey];
      return {
        semaine: `S${p.semaine}`,
        valeur: val != null ? (isPercentage ? Number((val * 100).toFixed(1)) : val) : null,
      };
    });

  const formattedTarget = target != null ? (isPercentage ? target * 100 : target) : null;

  return (
    <div className="w-full h-72 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="semaine" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis
            tickLine={false}
            tick={{ fontSize: 12, fill: '#64748B' }}
            unit={isPercentage ? '%' : kpiKey === 'dmt' ? 's' : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: any) => [
              `${value}${isPercentage ? '%' : kpiKey === 'dmt' ? 's' : ''}`,
              KPI_LABELS[kpiKey] || kpiKey.toUpperCase(),
            ]}
          />
          <Legend />
          {formattedTarget != null && (
            <ReferenceLine
              y={formattedTarget}
              label={{
                value: `Cible (${formattedTarget}${isPercentage ? '%' : 's'})`,
                fill: '#814BE7',
                fontSize: 11,
                position: 'top',
              }}
              stroke="#814BE7"
              strokeDasharray="4 4"
            />
          )}
          <Line
            type="monotone"
            dataKey="valeur"
            name={KPI_LABELS[kpiKey] || kpiKey.toUpperCase()}
            stroke="#814BE7"
            strokeWidth={3}
            dot={{ r: 5, fill: '#814BE7', strokeWidth: 2, stroke: '#FFFFFF' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
