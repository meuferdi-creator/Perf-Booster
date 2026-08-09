import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface ComparativeKpiChartProps {
  agentData: Record<string, number>;
  teamAvgData: Record<string, number>;
}

export const ComparativeKpiChart: React.FC<ComparativeKpiChartProps> = ({ agentData, teamAvgData }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = [
    { kpi: 'RAP', Agent: (agentData.rap ?? 0) * 100, Equipe: (teamAvgData.rap ?? 0) * 100 },
    { kpi: 'TR', Agent: (agentData.tr ?? 0) * 100, Equipe: (teamAvgData.tr ?? 0) * 100 },
    { kpi: 'CCX', Agent: (agentData.ccx ?? 0) * 100, Equipe: (teamAvgData.ccx ?? 0) * 100 },
  ];

  const textColor = isDark ? '#CBD5E1' : '#334155';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="kpi" tickLine={false} tick={{ fontSize: 12, fill: textColor, fontWeight: 600 }} />
          <YAxis tickLine={false} tick={{ fontSize: 12, fill: textColor, fontWeight: 600 }} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              color: textColor,
              borderRadius: '12px',
              border: `1px solid ${tooltipBorder}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            }}
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`]}
          />
          <Legend wrapperStyle={{ color: textColor, fontSize: '12px', fontWeight: 600 }} />
          <Bar dataKey="Agent" fill="#814BE7" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Equipe" fill={isDark ? '#475569' : '#CBD5E1'} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
