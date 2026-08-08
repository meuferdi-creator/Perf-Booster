import React from 'react';
import { Target, TrendingUp, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { formatKpiValue, KPI_LABELS } from '../../lib/kpi-utils';

interface ObjectiveKpiCardProps {
  kpiKey: string;
  currentValue: number | null;
  target100: number;
  target110?: number;
  unit?: string;
}

export const ObjectiveKpiCard: React.FC<ObjectiveKpiCardProps> = ({
  kpiKey,
  currentValue,
  target100,
  target110,
}) => {
  const isPercentage = ['rap', 'tr', 'ccx'].includes(kpiKey);
  const lowerIsBetter = ['tr', 'dmt'].includes(kpiKey);

  let progress = 0;
  if (currentValue != null && target100 > 0) {
    if (lowerIsBetter) {
      progress = (target100 / currentValue) * 100;
    } else {
      progress = (currentValue / target100) * 100;
    }
  }

  const statusColor = progress >= 100 ? 'text-emerald-600' : progress >= 90 ? 'text-amber-600' : 'text-rose-600';
  const progressColor = progress >= 100 ? 'emerald' : progress >= 90 ? 'amber' : 'rose';
  const accentBorder = progress >= 100 ? 'border-l-4 border-l-emerald-500' : progress >= 90 ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-rose-500';

  return (
    <Card className={`flex flex-col justify-between ${accentBorder}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {KPI_LABELS[kpiKey] || kpiKey.toUpperCase()}
          </span>
          <Badge variant={progress >= 100 ? 'success' : progress >= 90 ? 'warning' : 'danger'}>
            {progress >= 100 ? 'Atteint 100%' : `${Math.round(progress)}% de la cible`}
          </Badge>
        </div>

        <div className="flex items-baseline justify-between my-2">
          <div>
            <span className={`text-3xl font-black ${statusColor}`}>
              {formatKpiValue(kpiKey, currentValue)}
            </span>
            <span className="text-xs text-slate-400 ml-2">Actuel</span>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-[#814BE7]">
              {formatKpiValue(kpiKey, target100)}
            </span>
            <span className="text-xs text-slate-400 block">Cible 100%</span>
          </div>
        </div>

        <Progress value={progress} color={progressColor} size="md" className="my-3" />
      </div>

      {target110 != null && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Prochain palier (110%) :</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {formatKpiValue(kpiKey, target110)}
          </span>
        </div>
      )}
    </Card>
  );
};
