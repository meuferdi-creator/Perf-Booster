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

interface ComparativeKpiChartProps {
  agentData: Record<string, number>;
  teamAvgData: Record<string, number>;
}

export const ComparativeKpiChart: React.FC<ComparativeKpiChartProps> = ({ agentData, teamAvgData }) => {
  const chartData = [
    { kpi: 'RAP', Agent: (agentData.rap ?? 0) * 100, Equipe: (teamAvgData.rap ?? 0) * 100 },
    { kpi: 'TR', Agent: (agentData.tr ?? 0) * 100, Equipe: (teamAvgData.tr ?? 0) * 100 },
    { kpi: 'CCX', Agent: (agentData.ccx ?? 0) * 100, Equipe: (teamAvgData.ccx ?? 0) * 100 },
  ];

  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="kpi" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
          <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
            formatter={(value: any) => [`${Number(value).toFixed(1)}%`]}
          />
          <Legend />
          <Bar dataKey="Agent" fill="#814BE7" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Equipe" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
