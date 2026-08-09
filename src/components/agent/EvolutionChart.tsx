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
import { KPI_LABELS, calculateAssiduiteFromPerf } from '../../lib/kpi-utils';
import { useTheme } from '../../context/ThemeContext';

interface EvolutionChartProps {
  data: WeeklyPerformance[];
  kpiKey: string;
  target?: number;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data, kpiKey, target }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isPercentage = ['rap', 'tr', 'ccx', 'assiduite', 'presence'].includes(kpiKey);

  const chartData = [...data]
    .sort((a, b) => a.semaine - b.semaine)
    .map((p) => {
      let val = (p as any)[kpiKey];
      if (kpiKey === 'assiduite' || kpiKey === 'presence') {
        const calculated = calculateAssiduiteFromPerf(p);
        val = calculated != null ? calculated : null;
      } else if (val != null && isPercentage) {
        val = val <= 1 ? Number((val * 100).toFixed(1)) : Number(val.toFixed(1));
      }
      return {
        semaine: `S${p.semaine}`,
        valeur: val,
      };
    });

  const formattedTarget = target != null ? (isPercentage ? target * 100 : target) : null;

  const textColor = isDark ? '#CBD5E1' : '#334155';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="w-full h-72 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="semaine" tickLine={false} tick={{ fontSize: 12, fill: textColor, fontWeight: 600 }} />
          <YAxis
            tickLine={false}
            tick={{ fontSize: 12, fill: textColor, fontWeight: 600 }}
            unit={isPercentage ? '%' : kpiKey === 'dmt' ? 's' : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              color: textColor,
              borderRadius: '12px',
              border: `1px solid ${tooltipBorder}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
            formatter={(value: any) => [
              `${value}${isPercentage ? '%' : kpiKey === 'dmt' ? 's' : ''}`,
              KPI_LABELS[kpiKey] || kpiKey.toUpperCase(),
            ]}
          />
          <Legend wrapperStyle={{ color: textColor, fontSize: '12px', fontWeight: 600 }} />
          {formattedTarget != null && (
            <ReferenceLine
              y={formattedTarget}
              label={{
                value: `Cible (${formattedTarget}${isPercentage ? '%' : 's'})`,
                fill: '#814BE7',
                fontSize: 11,
                position: 'top',
                fontWeight: 700,
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
            dot={{ r: 5, fill: '#814BE7', strokeWidth: 2, stroke: isDark ? '#0F172A' : '#FFFFFF' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
