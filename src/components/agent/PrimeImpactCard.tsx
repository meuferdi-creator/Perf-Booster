import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, AlertCircle, ShieldCheck, DollarSign, TrendingDown } from 'lucide-react';
import { formatFCFA, MAX_PRIME, getAssiduiteDetails } from '../../lib/kpi-utils';

interface PrimeImpactCardProps {
  agentName?: string;
  pvSansPresence: number; // Potential prime calculated from KPIs
  presencePct?: number; // e.g. 99.7 or 95.0
  hPlanifiees?: number; // e.g. 160
  hAbsence?: number; // e.g. 8
  hEffectuees?: number; // e.g. 152
  maxSeuil?: number; // default MAX_PRIME (50000)
}

export const PrimeImpactCard: React.FC<PrimeImpactCardProps> = ({
  agentName = 'Agent Support',
  pvSansPresence,
  presencePct,
  hPlanifiees,
  hAbsence,
  hEffectuees,
  maxSeuil = MAX_PRIME,
}) => {
  // Compute assiduite details
  const assiduiteDetails = getAssiduiteDetails({
    h_planifiees: hPlanifiees ?? 160,
    h_absence: hAbsence ?? 0,
    presence: presencePct,
  });

  const effPresence = presencePct ?? assiduiteDetails.assiduitePct;
  const pvFinale = Math.round(pvSansPresence * (effPresence / 100));

  // PERTE PV = Seuil Max - PV finale (Gap to maximum potential prime threshold)
  const pertePv = Math.max(0, maxSeuil - pvFinale);
  // Impact direct absence = PV sans presence - PV finale
  const impactAbsence = Math.max(0, pvSansPresence - pvFinale);

  return (
    <Card className="p-6 border-indigo-100 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 shadow-md space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <Badge variant="purple" size="sm" className="mb-1 font-bold">
            Périmètre Prime & Présence
          </Badge>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Visibilité de l'Impact Présence / Absence sur la Prime
          </h3>
          <p className="text-2xs text-slate-500">
            Comparatif transparent entre la prime potentielle théorique et la prime réellement perçue selon l'assiduité.
          </p>
        </div>

        <div className="text-right">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold block">
            Agent Évalué
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
            {agentName}
          </span>
        </div>
      </div>

      {/* 1. Assiduité Calculation Section */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#814BE7]" /> Calcul de l'Assiduité (Présence)
          </span>
          <Badge variant={assiduiteDetails.assiduitePct >= 95 ? 'success' : 'warning'}>
            Taux d'assiduité : {assiduiteDetails.formattedAssiduite}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs text-slate-400 font-bold block uppercase">Heures Planifiées</span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200">
              {assiduiteDetails.hPlanifiees} h
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-2xs text-slate-400 font-bold block uppercase">Heures Effectuées</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {assiduiteDetails.hEffectuees} h
            </span>
            <span className="text-3xs text-slate-400 block mt-0.5">
              ({assiduiteDetails.hAbsence} h d'absence)
            </span>
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <span className="text-2xs text-[#814BE7] font-bold block uppercase">Formule Assiduité</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              ({assiduiteDetails.hEffectuees} / {assiduiteDetails.hPlanifiees}) × 100
            </span>
            <span className="text-xs font-black text-[#814BE7]">
              = {assiduiteDetails.formattedAssiduite}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Prime Impact Grid - Exactly matching screenshot layout */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-100 dark:border-slate-800 space-y-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Aperçu de la Fiche de Prime</span>
          <span className="text-3xs text-slate-400">Seuil de Référence : {formatFCFA(maxSeuil)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {/* PV Sans Présence */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              PV Sans Présence (Prime Potentielle)
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatFCFA(pvSansPresence)}
            </span>
            <span className="text-3xs text-slate-400 block mt-1">Calculée selon la grille de performance KPI</span>
          </div>

          {/* PERTE PV / Gap to Seuil Max */}
          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
            <span className="text-2xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1 flex items-center justify-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> PERTE PV / Manque à Gagner
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatFCFA(pertePv)}
            </span>
            <span className="text-3xs text-rose-500 dark:text-rose-400/80 block mt-1">
              Écart par rapport au Seuil Max ({formatFCFA(maxSeuil)})
              {impactAbsence > 0 && ` · dont ${formatFCFA(impactAbsence)} dus à l'absence`}
            </span>
          </div>

          {/* PV Finale */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#814BE7]/10 to-indigo-100/50 dark:from-indigo-950 dark:to-slate-800 border-2 border-[#814BE7]/30">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#814BE7] block mb-1">
              PV Finale (Prime Perçue)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#814BE7]">
              {formatFCFA(pvFinale)}
            </span>
            <span className="text-3xs text-slate-500 dark:text-slate-400 block mt-1">
              Appliqué : {formatFCFA(pvSansPresence)} × {effPresence.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Summary Table Row */}
        <div className="overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-2xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 font-bold">Agent</th>
                <th className="py-2 font-bold">Type</th>
                <th className="py-2 font-bold text-center">Taux d'absence</th>
                <th className="py-2 font-bold text-center">Prime Potentielle</th>
                <th className="py-2 font-bold text-right">Prime Perçue (Finale)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-bold text-slate-800 dark:text-slate-200">
                <td className="py-2.5">{agentName}</td>
                <td className="py-2.5">
                  <Badge variant="purple" size="sm">Prime Variable</Badge>
                </td>
                <td className="py-2.5 text-center text-amber-600 font-mono">
                  {assiduiteDetails.formattedAbsence}
                </td>
                <td className="py-2.5 text-center font-mono">
                  {formatFCFA(pvSansPresence)}
                </td>
                <td className="py-2.5 text-right font-mono text-base font-black text-[#814BE7]">
                  {formatFCFA(pvFinale)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};
