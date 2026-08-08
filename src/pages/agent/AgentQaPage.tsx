import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance } from '../../types';
import { formatKpiValue, getKpiStatus } from '../../lib/kpi-utils';

export const AgentQaPage: React.FC = () => {
  const auth = getStoredAuth();
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getWeeklyPerformances();
      const agentId = currentAuth?.id || 'agent-1163';
      setPerfs(all.filter((p) => p.agent_id === agentId || p.log_activite === currentAuth?.log_activite));
    };

    update();
    return store.subscribe(update);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Avis & Conformité QA</h1>
        <p className="text-xs text-slate-500">
          Évaluations Qualité (Conformité, Respect des procédures, Grille de contrôle)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {perfs.map((p) => {
          const rapStatus = getKpiStatus(p.rap, 0.848, 'rap');
          const ccxStatus = getKpiStatus(p.ccx, 0.93, 'ccx');
          const trStatus = getKpiStatus(p.tr, 0.145, 'tr');
          const dmtStatus = getKpiStatus(p.dmt, 590, 'dmt');

          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#814BE7]" />
                  <div>
                    <h3 className="font-bold text-slate-900">Semaine {p.semaine} · {p.canal}</h3>
                    <p className="text-3xs text-slate-400">Audité par l'équipe QA</p>
                  </div>
                </div>
                <Badge variant="purple">S{p.semaine}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className={`p-3 rounded-xl flex items-center justify-between ${rapStatus === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : rapStatus === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                  <span className="font-medium">RAP (Résolution)</span>
                  <span className="font-bold">{formatKpiValue('rap', p.rap)}</span>
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between ${ccxStatus === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : ccxStatus === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                  <span className="font-medium">CCX (Expérience)</span>
                  <span className="font-bold">{formatKpiValue('ccx', p.ccx)}</span>
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between ${trStatus === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : trStatus === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                  <span className="font-medium">TR (Transferts)</span>
                  <span className="font-bold">{formatKpiValue('tr', p.tr)}</span>
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between ${dmtStatus === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : dmtStatus === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                  <span className="font-medium">DMT (Durée)</span>
                  <span className="font-bold">{formatKpiValue('dmt', p.dmt)}</span>
                </div>
              </div>

              {p.qa_notes && (
                <div className="p-3 bg-indigo-50/50 rounded-xl text-xs text-slate-700">
                  <span className="font-bold text-[#814BE7]">Remarques QA : </span>
                  {p.qa_notes}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
