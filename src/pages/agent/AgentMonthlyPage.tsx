import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Award, CheckCircle, Percent } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { MonthlyResult } from '../../types';
import { formatFCFA, getStatutStyle } from '../../lib/kpi-utils';

export const AgentMonthlyPage: React.FC = () => {
  const auth = getStoredAuth();
  const [monthlyRes, setMonthlyRes] = useState<MonthlyResult | null>(null);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getMonthlyResults();
      const agentId = currentAuth?.id || 'agent-1163';
      const myMonth = all.find((m) => m.agent_id === agentId || m.agent_name.includes(currentAuth?.prenom || 'Shalom'));
      setMonthlyRes(myMonth || all[0]);
    };

    update();
    return store.subscribe(update);
  }, []);

  if (!monthlyRes) {
    return <Card className="p-8 text-center text-slate-400">Aucun résultat mensuel disponible.</Card>;
  }

  const statusStyle = getStatutStyle(monthlyRes.statut);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Mon Mois & Primes</h1>
        <p className="text-xs text-slate-500">
          Calcul final de la prime variable multicanal modulée par la présence ({monthlyRes.mois_label})
        </p>
      </div>

      {/* Main Monthly Summary Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-white via-indigo-50/20 to-white border-indigo-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-100">
          <div>
            <Badge variant="purple" size="md" className="mb-2">
              Période : {monthlyRes.mois_label}
            </Badge>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {monthlyRes.agent_name}
            </h2>
            <p className="text-xs text-slate-500">
              Matricule : {monthlyRes.matricule_rh} · Ancienneté : {monthlyRes.anciennete}
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xs text-slate-400 uppercase tracking-wider block font-bold">
              Prime Variable Finale
            </span>
            <span className="text-3xl font-black text-[#814BE7]">
              {formatFCFA(monthlyRes.pv_finale)}
            </span>
            <div className="mt-1">
              <Badge variant={monthlyRes.pv_finale >= 45000 ? 'success' : monthlyRes.pv_finale >= 20000 ? 'info' : 'warning'}>
                {monthlyRes.statut}
              </Badge>
            </div>
          </div>
        </div>

        {/* Breakdown Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-xs text-slate-400 block font-semibold">Volume Total Contacts</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{monthlyRes.vol_total}</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-xs text-slate-400 block font-semibold">PV Brute (100% Présence)</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{formatFCFA(monthlyRes.pv_sans_presence)}</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs">
            <span className="text-xs text-slate-400 block font-semibold">Taux de Présence</span>
            <span className="text-xl font-bold text-emerald-600">{monthlyRes.presence}%</span>
          </div>
        </div>

        {/* Channel Weight Contributions */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pondération et Contributions par Canal
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold block text-slate-700">Phone</span>
              <span className="text-slate-500">Poids: {monthlyRes.poids_phone ?? 0}%</span>
              <span className="block font-semibold text-[#814BE7] mt-1">
                {formatFCFA(monthlyRes.contrib_phone)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold block text-slate-700">Email</span>
              <span className="text-slate-500">Poids: {monthlyRes.poids_email ?? 0}%</span>
              <span className="block font-semibold text-[#814BE7] mt-1">
                {formatFCFA(monthlyRes.contrib_email)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold block text-slate-700">MU</span>
              <span className="text-slate-500">Poids: {monthlyRes.poids_mu ?? 0}%</span>
              <span className="block font-semibold text-[#814BE7] mt-1">
                {formatFCFA(monthlyRes.contrib_mu)}
              </span>
            </div>
          </div>
        </div>

        {/* Manager Comment */}
        {monthlyRes.commentaire && (
          <div className="mt-6 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-slate-700">
            <span className="font-bold text-[#814BE7]">Commentaire de validation du Manager : </span>
            {monthlyRes.commentaire}
          </div>
        )}
      </Card>
    </div>
  );
};
