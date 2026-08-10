import React from 'react';
import { Card } from '../ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { CanalType, AncienneteType, WeeklyPerformance } from '../../types';
import {
  getKpiContributions,
  formatFCFA,
  KPI_KEYS,
  KPI_LABELS,
  CanalType as Canal,
} from '../../lib/kpi-utils';

interface KpiContributionsTableProps {
  canal: CanalType;
  anciennete: AncienneteType;
  perf: Partial<WeeklyPerformance> | undefined | null;
  targets: Record<string, number>;
  volume?: number;
  poidsActes?: number; // percentage, e.g., 55.3
}

export const KpiContributionsTable: React.FC<KpiContributionsTableProps> = ({
  canal,
  anciennete,
  perf,
  targets,
  volume = 408,
  poidsActes,
}) => {
  const result = getKpiContributions(perf, targets, canal, anciennete);
  const { contributions, totalIndexScore, totalPrimeAvantPoids, totalPrimePonderee } = result;

  return (
    <Card className="p-5 border border-indigo-100 shadow-md space-y-4 bg-white dark:bg-slate-900">
      {/* Table Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#814BE7]" />
            {canal.toUpperCase()} — DÉTAIL DES CONTRIBUTIONS
          </h3>
          <p className="text-2xs text-slate-500">
            Décomposition pondérée de l'indice global de qualité et de la prime par indicateur (Pondération 30% / 30% / 20% / 20%)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Volume : <strong className="text-slate-900 dark:text-slate-100 font-bold">{volume}</strong>
          </span>
          {poidsActes != null && (
            <span className="text-slate-500 font-medium">
              Poids actes : <strong className="text-[#814BE7] font-bold">{poidsActes.toFixed(1)}%</strong>
            </span>
          )}
        </div>
      </div>

      {/* Contributions Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">KPI</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Résultat Réel</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Cible 100%</TableHead>
              <TableHead className="font-bold text-[#814BE7] text-center">Poids KPI</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Part dans l'Indice</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-right">Prix KPI avant poids</TableHead>
              <TableHead className="font-bold text-emerald-600 dark:text-emerald-400 text-right">Prix KPI pondéré</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {KPI_KEYS.map((k) => {
              const c = contributions[k];
              if (!c) return null;

              return (
                <TableRow key={k} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/30">
                  <TableCell className="font-black text-slate-900 dark:text-slate-100">
                    {c.label}
                  </TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                    {c.formattedValue}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {c.formattedTarget}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="purple" size="sm" className="font-bold">
                      {c.weightPct}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-[#814BE7]">
                    {c.contributionIndexPct.toFixed(2)} pts
                  </TableCell>
                  <TableCell className="text-right text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {formatFCFA(c.primeAvantPoids)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {formatFCFA(c.primePonderee)}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Total Summary Row */}
            <TableRow className="bg-indigo-50/50 dark:bg-slate-800/80 font-black border-t-2 border-indigo-200 dark:border-slate-700">
              <TableCell colSpan={3} className="text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                Total contribution {canal}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="success" size="sm" className="font-black">
                  100%
                </Badge>
              </TableCell>
              <TableCell className="text-center text-sm font-black text-[#814BE7] font-mono">
                {totalIndexScore.toFixed(2)}%
              </TableCell>

              <TableCell className="text-right text-xs text-slate-500 font-mono">
                {formatFCFA(totalPrimeAvantPoids)}
              </TableCell>
              <TableCell className="text-right text-base font-black text-[#814BE7] font-mono">
                {formatFCFA(totalPrimePonderee)}
              </TableCell>
            </TableRow>
          </tbody>
        </Table>
      </div>
    </Card>
  );
};
