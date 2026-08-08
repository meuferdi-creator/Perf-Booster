import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatKpiValue, getKpiStatus, getStatusBg, KPI_LABELS, LOWER_IS_BETTER } from '../../lib/kpi-utils';

interface KpiCardProps {
  kpiKey: string;
  label?: string;
  value: number | null | undefined;
  target: number | null | undefined;
  unit?: string;
  prevValue?: number | null;
  primePotentielle?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  kpiKey,
  label,
  value,
  target,
  prevValue,
  primePotentielle,
}) => {
  const displayLabel = label || KPI_LABELS[kpiKey] || kpiKey.toUpperCase();
  const status = getKpiStatus(value, target, kpiKey);
  const bgStyle = getStatusBg(status);

  const formattedVal = formatKpiValue(kpiKey, value);
  const formattedTarget = formatKpiValue(kpiKey, target);

  // Delta calculation
  let deltaText = '';
  let isPositive = false;
  let isNegative = false;

  if (value != null && prevValue != null && !isNaN(value) && !isNaN(prevValue)) {
    const lower = LOWER_IS_BETTER.includes(kpiKey);
    const diff = value - prevValue;
    if (kpiKey === 'dmt') {
      deltaText = `${diff > 0 ? '+' : ''}${Math.round(diff)}s`;
      isPositive = lower ? diff < 0 : diff > 0;
      isNegative = lower ? diff > 0 : diff < 0;
    } else {
      const pDiff = (diff * 100).toFixed(1);
      deltaText = `${diff > 0 ? '+' : ''}${pDiff}%`;
      isPositive = lower ? diff < 0 : diff > 0;
      isNegative = lower ? diff > 0 : diff < 0;
    }
  }

  const valueColor =
    status === 'success'
      ? 'text-emerald-600'
      : status === 'warning'
      ? 'text-amber-600'
      : status === 'danger'
      ? 'text-rose-600'
      : 'text-slate-900 dark:text-slate-100';

  const accentBorder =
    status === 'success'
      ? 'border-l-4 border-l-emerald-500'
      : status === 'warning'
      ? 'border-l-4 border-l-amber-500'
      : status === 'danger'
      ? 'border-l-4 border-l-rose-500'
      : '';

  return (
    <Card className={`relative overflow-hidden group transition-all ${accentBorder}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {displayLabel}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${valueColor}`}>{formattedVal}</span>
            {deltaText && (
              <span
                className={`inline-flex items-center text-xs font-bold ${
                  isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {isPositive && <TrendingUp className="w-3 h-3 mr-0.5" />}
                {isNegative && <TrendingDown className="w-3 h-3 mr-0.5" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3 mr-0.5" />}
                {deltaText}
              </span>
            )}
          </div>
        </div>

        <Badge
          variant={
            status === 'success' ? 'success' : status === 'warning' ? 'warning' : status === 'danger' ? 'danger' : 'neutral'
          }
        >
          {status === 'success' ? 'Conforme' : status === 'warning' ? 'Attention' : status === 'danger' ? 'Sous cible' : 'N/A'}
        </Badge>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-slate-400" />
          <span>Cible: <strong className="text-slate-800 dark:text-slate-200">{formattedTarget}</strong></span>
        </div>

        {primePotentielle != null && primePotentielle > 0 && (
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950/40">
            +{primePotentielle.toLocaleString('fr-FR')} FCFA
          </span>
        )}
      </div>
    </Card>
  );
};
