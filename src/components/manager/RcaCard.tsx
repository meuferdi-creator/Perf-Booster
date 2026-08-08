import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Trash2, Plus, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { RCA, ActionItem } from '../../types';
import { store } from '../../lib/store';

interface RcaCardProps {
  rca: RCA;
  actionItems: ActionItem[];
  onAddAction: (rcaId: string) => void;
  onDeleteRca: (rcaId: string) => void;
}

export const RcaCard: React.FC<RcaCardProps> = ({
  rca,
  actionItems,
  onAddAction,
  onDeleteRca,
}) => {
  const priorityVariant = {
    haute: 'danger',
    moyenne: 'warning',
    basse: 'info',
  }[rca.priorite] as any;

  const statusVariant = {
    ouvert: 'danger',
    en_cours: 'warning',
    resolu: 'success',
    cloture: 'neutral',
  }[rca.statut] as any;

  const statusLabel = {
    ouvert: 'Ouvert',
    en_cours: 'En cours',
    resolu: 'Résolu',
    cloture: 'Clôturé',
  }[rca.statut];

  const handleActionStatusChange = (action: ActionItem, newStatut: ActionItem['statut']) => {
    let progres = 0;
    if (newStatut === 'en_cours') progres = 50;
    if (newStatut === 'termine') progres = 100;

    store.saveActionItem({
      ...action,
      statut: newStatut,
      progres,
    });
  };

  const handleDeleteAction = (actionId: string) => {
    store.deleteActionItem(actionId);
  };

  return (
    <Card className="relative hover:border-slate-300 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-[#814BE7] rounded-xl dark:bg-indigo-950/50">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">{rca.agent_name}</h4>
              <span className="text-xs text-slate-400">· Semaine {rca.semaine}</span>
              {rca.kpi_concerne && (
                <Badge variant="purple" size="sm">
                  KPI {rca.kpi_concerne}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{rca.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Badge variant={priorityVariant}>Priorité {rca.priorite}</Badge>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <button
            onClick={() => onDeleteRca(rca.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-2"
            title="Supprimer le RCA"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Root Cause Analysis */}
      {rca.analyse_cause && (
        <div className="my-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="font-bold text-[#814BE7]">Cause racine : </span>
          {rca.analyse_cause}
        </div>
      )}

      {/* Action Items List */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Plan d'actions ({actionItems.length})
          </span>
          <Button size="sm" variant="ghost" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onAddAction(rca.id)}>
            Ajouter une action
          </Button>
        </div>

        {actionItems.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">Aucune action corrective enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {actionItems.map((act) => (
              <div
                key={act.id}
                className="p-3 border border-slate-100 rounded-xl bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{act.action}</p>
                  <div className="flex items-center gap-3 text-2xs text-slate-400 mt-1">
                    {act.responsable && <span>Resp: {act.responsable}</span>}
                    {act.echeance && <span>Échéance: {act.echeance}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={act.progres} size="sm" color={act.progres === 100 ? 'emerald' : 'purple'} />
                  </div>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg dark:bg-slate-800">
                    <button
                      onClick={() => handleActionStatusChange(act, 'a_faire')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-2xs cursor-pointer ${
                        act.statut === 'a_faire' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      À faire
                    </button>
                    <button
                      onClick={() => handleActionStatusChange(act, 'en_cours')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-2xs cursor-pointer ${
                        act.statut === 'en_cours' ? 'bg-amber-100 text-amber-800' : 'text-slate-500'
                      }`}
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => handleActionStatusChange(act, 'termine')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-2xs cursor-pointer ${
                        act.statut === 'termine' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
                      }`}
                    >
                      Terminé
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteAction(act.id)}
                    className="p-1 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
